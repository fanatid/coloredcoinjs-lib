var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var Coin = coloredcoinlib.Coin


describe('Coin', function() {
  var bs, cDataStore, cData, cdStore, cdManager
  var coin

  beforeEach(function() {
    bs = new coloredcoinlib.blockchain.BlockrIOAPI({ testnet: true })
    cDataStore = new coloredcoinlib.store.ColorDataStore({ testnet: true, testEnv: true })
    cData = new coloredcoinlib.ColorData({ cdStore: cDataStore, blockchain: bs })
    cdStore = new coloredcoinlib.store.ColorDefinitionStore({ testnet: true, testEnv: true })
    cdManager = new coloredcoinlib.ColorDefinitionManager(cdStore)
  })

  afterEach(function() {
    cDataStore.clear()
    cdStore.clear()
  })

  describe('isConfirmed', function() {
    it('return true', function() {
      coin = new Coin({
        colorDefinitionManager: cdManager,
        colorData: cData,
        txId: 'e28907304807b7b01c09c23dc09b76968d66c3c7f75359c1c37e90e0015f1dbc',
        outIndex: 0,
        value: 1,
        confirmations: 1
      })
      expect(coin.isConfirmed()).to.be.true
    })

    it('return false', function() {
      coin = new Coin({
        colorDefinitionManager: cdManager,
        colorData: cData,
        txId: 'e28907304807b7b01c09c23dc09b76968d66c3c7f75359c1c37e90e0015f1dbc',
        outIndex: 0,
        value: 1,
        confirmations: 0
      })
      expect(coin.isConfirmed()).to.be.false
    })
  })

  describe('getMainColorValue', function() {
    beforeEach(function() {
      cdManager.resolveByScheme({ scheme: 'epobc:0984352ebe025daec2954cae4d09f77fd7bd79300479838f21acc9961da28cf1:1:271192' })
      cdManager.resolveByScheme({ scheme: 'epobc:e28907304807b7b01c09c23dc09b76968d66c3c7f75359c1c37e90e0015f1dbc:0:271191' })
      coin = new Coin({
        colorDefinitionManager: cdManager,
        colorData: cData,
        txId: '9251fb943863fdced00bf9a8f327b5ac8e6aab60e46ee48713e3f21adba74f91',
        outIndex: 1,
        value: 500000,
        confirmations: 1
      })
    })

    it('getColorValue return error', function(done) {
      coin.getColorValue = function(_, cb) { cb('error.getColorValue') }
      coin.getMainColorValue(function(error, colorValue) {
        expect(error).to.equal('error.getColorValue')
        expect(colorValue).to.be.undefined
        done()
      })
    })

    it('getColorValue return more than one ColorValue', function(done) {
      coin.getColorValue = function(_, cb) {
        cb(null, new coloredcoinlib.ColorValue({ colordef: cdManager.getUncolored(), value: 0 }))
      }
      coin.getMainColorValue(function(error, colorValue) {
        expect(error).to.deep.equal(new Error('Coin ' + coin + ' have more that one ColorValue'))
        expect(colorValue).to.be.undefined
        done()
      })
    })

    it('return ColorValue, sended from genesis', function(done) {
      coin.getMainColorValue(function(error, colorValue) {
        expect(error).to.be.null
        expect(colorValue).to.deep.equal(new coloredcoinlib.ColorValue({
          colordef: cdManager.resolveByScheme({ scheme: 'epobc:e28907304807b7b01c09c23dc09b76968d66c3c7f75359c1c37e90e0015f1dbc:0:271191' }),
          value: 500000
        }))
        done()
      })
    })

    it('return uncolored', function(done) {
      coin.txId = 'f92c59c13c4f830826d8efea3c4aee8368444babf1c7db9546fefbb264c2d628'
      coin.outIndex = 1
      coin.value = 3457000000
      coin.getMainColorValue(function(error, colorValue) {
        expect(error).to.be.null
        expect(colorValue).to.deep.equal(new coloredcoinlib.ColorValue({
          colordef: cdManager.getUncolored(),
          value: 3457000000
        }))
        done()
      })
    })
  })

  it('toString', function() {
    coin = new Coin({
      colorDefinitionManager: cdManager,
      colorData: cData,
      txId: 'e28907304807b7b01c09c23dc09b76968d66c3c7f75359c1c37e90e0015f1dbc',
      outIndex: 0,
      value: 1,
      confirmations: 1
    })
    expect(coin.toString()).to.equal('e28907304807b7b01c09c23dc09b76968d66c3c7f75359c1c37e90e0015f1dbc:0')
  })
})
