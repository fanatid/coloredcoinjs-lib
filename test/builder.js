var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var blockchain = coloredcoinlib.blockchain
var builder = coloredcoinlib.builder
var colordef = coloredcoinlib.colordef
var store = coloredcoinlib.store


describe('builder', function() {
  describe('BasicColorDataBuilder', function() {
    var bs, epobc, cdstore
    var cdb

    beforeEach(function() {
      cdstore = new store.ColorDataStore('memory')
      bs = new blockchain.BlockchainStateBase()
      epobc = new colordef.EPOBCColorDefinition(1, { txHash: 'genesis', outIndex: 0, height: 0 })

      cdb = new builder.BasicColorDataBuilder(cdstore, bs, epobc)
    })

    it('inherits DataStore', function() {
      expect(cdb).to.be.instanceof(builder.ColorDataBuilder)
      expect(cdb).to.be.instanceof(builder.BasicColorDataBuilder)
    })

    it('', function(done) {
      done()
    })
  })
})
