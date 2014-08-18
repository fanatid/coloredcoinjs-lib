var expect = require('chai').expect

var cclib = require('../src/index')


describe('coin.CoinList', function() {
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
  })

  afterEach(function() {
    cDataStorage.clear()
    cdStorage.clear()
  })

  describe('getTotalValue', function() {
    it('split from genesis', function(done) {
      coinQuery = new cclib.coin.CoinQuery({
        addresses: ['mtwcUY5zfQwgLdrCNDq9JiYAu54h257RA1'],
        blockchain: bs,
        colorData: cData,
        colorDefinitionManager: cdManager
      })
      coinQuery.getCoins(function(error, coinList) {
        expect(error).to.be.null
        expect(coinList).to.be.instanceof(cclib.coin.CoinList).with.to.have.length(1)
        coinList.getTotalValue(function(error, colorValues) {
          expect(error).to.be.null
          expect(colorValues).to.be.instanceof(Array).with.to.have.length(1)
          expect(colorValues[0].getColorDefinition()).to.deep.equal(colordef)
          expect(colorValues[0].getValue()).to.equal(500000)
          done()
        })
      })
    })

    it('split from genesis + split split from genesis', function(done) {
      coinQuery = new cclib.coin.CoinQuery({
        addresses: ['mtwcUY5zfQwgLdrCNDq9JiYAu54h257RA1', 'n2DMTwPLkcMb8xNRhmn2JWF685C8CFveq7'],
        blockchain: bs,
        colorData: cData,
        colorDefinitionManager: cdManager
      })
      coinQuery.getCoins(function(error, coinList) {
        expect(error).to.be.null
        expect(coinList).to.be.instanceof(cclib.coin.CoinList).with.to.have.length(2)
        coinList.getTotalValue(function(error, colorValues) {
          expect(error).to.be.null
          expect(colorValues).to.be.instanceof(Array).with.to.have.length(1)
          expect(colorValues[0].getColorDefinition()).to.deep.equal(colordef)
          expect(colorValues[0].getValue()).to.equal(750000)
          done()
        })
      })
    })
  })
})
