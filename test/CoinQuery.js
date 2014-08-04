var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var CoinQuery = coloredcoinlib.CoinQuery


describe('CoinQuery', function() {
  var amStore, am, bs, cDataStore, cData, cdStore, cdManager, colordef
  var coinQuery

  beforeEach(function() {
    amStore = new coloredcoinlib.store.AddressStore()
    am = new coloredcoinlib.AddressManager(amStore)
    bs = new coloredcoinlib.blockchain.BlockrIOAPI({ testnet: true })
    cDataStore = new coloredcoinlib.store.ColorDataStore()
    cData = new coloredcoinlib.ColorData({ cdStore: cDataStore, blockchain: bs })
    cdStore = new coloredcoinlib.store.ColorDefinitionStore()
    cdManager = new coloredcoinlib.ColorDefinitionManager(cdStore)
    cdManager.resolveByScheme({ scheme: 'epobc:0984352ebe025daec2954cae4d09f77fd7bd79300479838f21acc9961da28cf1:1:271192' })
    colordef = cdManager.resolveByScheme({ scheme: 'epobc:e28907304807b7b01c09c23dc09b76968d66c3c7f75359c1c37e90e0015f1dbc:0:271191' })

    coinQuery = new CoinQuery({
      addressManager: am,
      blockchain: bs,
      colorData: cData,
      colorDefinitionManager: cdManager
    })
  })

  afterEach(function() {
    amStore.clear()
    cDataStore.clear()
    cdStore.clear()
  })

  it('clone', function() {
    expect(coinQuery.clone()).to.deep.equal(coinQuery)
  })

  it('onlyColoredAs', function() {
    coinQuery = coinQuery.onlyColoredAs(cdManager.getUncolored())
    expect(coinQuery.query.onlyColoredAs).to.deep.equal(cdManager.getUncolored())
  })

  it('getConfirmed', function() {
    coinQuery = coinQuery.getConfirmed()
    expect(coinQuery.query.onlyConfirmed).to.be.true
    expect(coinQuery.query.onlyUnconfirmed).to.be.false
  })

  it('getUnconfirmed', function() {
    coinQuery = coinQuery.getUnconfirmed()
    expect(coinQuery.query.onlyConfirmed).to.be.false
    expect(coinQuery.query.onlyUnconfirmed).to.be.true
  })

  describe('getCoins', function(done) {
    this.timeout(5000)

    it('getUTXO return error', function(done) {
      am.getAllAddresses = function() {
        return [{ getAddress: function() { return 'mtwcUY5zfQwgLdrCNDq9JiYAu54h257RA1' } }]
      }
      bs.getUTXO = function(_, cb) { cb('error.getUTXO') }
      coinQuery.getCoins(function(error, coinList) {
        expect(error).to.equal('error.getUTXO')
        expect(coinList).to.be.undefined
        done()
      })
    })

    it('getMainColorValue return error', function() {
      //
    })

    it('onlyUnconfirmed', function(done) {
      am.getAllAddresses = function() {
        return [{ getAddress: function() { return 'mtwcUY5zfQwgLdrCNDq9JiYAu54h257RA1' } }]
      }
      coinQuery.getUnconfirmed().getCoins(function(error, coinList) {
        expect(error).to.be.null
        expect(coinList).to.be.instanceof(coloredcoinlib.CoinList).with.to.have.length(0)
        done()
      })
    })

    it('split from genesis', function(done) {
      am.getAllAddresses = function() {
        return [{ getAddress: function() { return 'mtwcUY5zfQwgLdrCNDq9JiYAu54h257RA1' } }]
      }
      coinQuery.getCoins(function(error, coinList) {
        expect(error).to.be.null
        expect(coinList).to.be.instanceof(coloredcoinlib.CoinList).with.to.have.length(1)
        expect(coinList[0].toString()).to.equal('9251fb943863fdced00bf9a8f327b5ac8e6aab60e46ee48713e3f21adba74f91:1')
        done()
      })
    })

    it('split from genesis + onlyColoredAs', function(done) {
      am.getAllAddresses = function() {
        return [{ getAddress: function() { return 'mtwcUY5zfQwgLdrCNDq9JiYAu54h257RA1' } }]
      }
      coinQuery.onlyColoredAs(colordef).getCoins(function(error, coinList) {
        expect(error).to.be.null
        expect(coinList).to.be.instanceof(coloredcoinlib.CoinList).with.to.have.length(1)
        expect(coinList[0].toString()).to.equal('9251fb943863fdced00bf9a8f327b5ac8e6aab60e46ee48713e3f21adba74f91:1')
        done()
      })
    })
  })
})
