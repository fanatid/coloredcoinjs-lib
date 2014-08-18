var expect = require('chai').expect

var cclib = require('../src/index')


describe('coin.CoinQuery', function() {
  var bs, cDataStorage, cData, cdStorage, cdManager, colordef
  var coinQuery

  beforeEach(function() {
    bs = new cclib.blockchain.BlockrIOAPI({ testnet: true })
    cDataStorage = new cclib.storage.ColorDataStorage()
    cData = new cclib.color.ColorData(cDataStorage, bs)
    cdStorage = new cclib.storage.ColorDefinitionStorage()
    cdManager = new cclib.color.ColorDefinitionManager(cdStorage)
    cdManager.resolveByScheme('epobc:0984352ebe025daec2954cae4d09f77fd7bd79300479838f21acc9961da28cf1:1:271192')
    colordef = cdManager.resolveByScheme('epobc:e28907304807b7b01c09c23dc09b76968d66c3c7f75359c1c37e90e0015f1dbc:0:271191')

    coinQuery = new cclib.coin.CoinQuery({
      addresses: ['mtwcUY5zfQwgLdrCNDq9JiYAu54h257RA1'],
      blockchain: bs,
      colorData: cData,
      colorDefinitionManager: cdManager
    })
  })

  afterEach(function() {
    cDataStorage.clear()
    cdStorage.clear()
  })

  it('clone', function() {
    expect(coinQuery.clone()).to.deep.equal(coinQuery)
  })

  it('onlyColoredAs single ColorDefinition', function() {
    coinQuery = coinQuery.onlyColoredAs(cdManager.getUncolored())
    expect(coinQuery.query.onlyColoredAs).to.deep.equal([cdManager.getUncolored().getColorId()])
  })

  it('onlyColoredAs array ColorDefinitions', function() {
    coinQuery = coinQuery.onlyColoredAs([cdManager.getUncolored()])
    expect(coinQuery.query.onlyColoredAs).to.deep.equal([cdManager.getUncolored().getColorId()])
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
    it('getUTXO return error', function(done) {
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
      coinQuery.getUnconfirmed().getCoins(function(error, coinList) {
        expect(error).to.be.null
        expect(coinList).to.be.instanceof(cclib.coin.CoinList).with.to.have.length(0)
        done()
      })
    })

    it('split from genesis', function(done) {
      coinQuery.getCoins(function(error, coinList) {
        expect(error).to.be.null
        expect(coinList).to.be.instanceof(cclib.coin.CoinList).with.to.have.length(1)
        expect(coinList[0].toString()).to.equal('9251fb943863fdced00bf9a8f327b5ac8e6aab60e46ee48713e3f21adba74f91:1')
        done()
      })
    })

    it('split from genesis + onlyColoredAs', function(done) {
      coinQuery.onlyColoredAs(colordef).getCoins(function(error, coinList) {
        expect(error).to.be.null
        expect(coinList).to.be.instanceof(cclib.coin.CoinList).with.to.have.length(1)
        expect(coinList[0].toString()).to.equal('9251fb943863fdced00bf9a8f327b5ac8e6aab60e46ee48713e3f21adba74f91:1')
        done()
      })
    })
  })
})
