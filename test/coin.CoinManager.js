var expect = require('chai').expect

var cclib = require('../src/index')


describe('coin.CoinManager', function() {
  var bs, cDataStorage, cData, cdStorage, cdManager, colordef
  var coinStorage, coinManager

  beforeEach(function() {
    bs = new cclib.blockchain.BlockrIOAPI({ testnet: true })
    cDataStorage = new cclib.storage.ColorDataStorage()
    cData = new cclib.color.ColorData(cDataStorage, bs)
    cdStorage = new cclib.storage.ColorDefinitionStorage()
    cdManager = new cclib.color.ColorDefinitionManager(cdStorage)
    cdManager.resolveByScheme('epobc:0984352ebe025daec2954cae4d09f77fd7bd79300479838f21acc9961da28cf1:1:271192')
    colordef = cdManager.resolveByScheme('epobc:e28907304807b7b01c09c23dc09b76968d66c3c7f75359c1c37e90e0015f1dbc:0:271191')

    coinStorage = new cclib.storage.CoinStorage()
    coinManager = new cclib.coin.CoinManager(coinStorage, cData, cdManager, bs)
  })

  afterEach(function() {
    cDataStorage.clear()
    cdStorage.clear()
  })

  it('updateCoins', function(done) {
    coinManager.updateCoins(['mtwcUY5zfQwgLdrCNDq9JiYAu54h257RA1'], function(error) {
      expect(error).to.be.null
      done()
    })
  })
})
