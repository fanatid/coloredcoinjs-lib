var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var blockchain = coloredcoinlib.blockchain
var builder = coloredcoinlib.builder
var colordef = coloredcoinlib.colordef
var store = coloredcoinlib.store


describe('builder', function() {
  describe('BasicColorDataBuilder', function() {
    describe('scanTx', function() {
      it('', function(done) {
        done()
      })
    })
  })

  describe('AidedColorDataBuilder', function() {
    var bs, epobc, cdstore
    var cdb

    beforeEach(function() {
      cdstore = new store.ColorDataStore('memory')
      bs = new blockchain.BlockchainStateBase()
      epobc = new colordef.EPOBCColorDefinition(1, { txHash: 'genesis', outIndex: 0, height: 0 })

      cdb = new builder.AidedColorDataBuilder(cdstore, bs, epobc)
    })

    it('inherits BasicColorDataBuilder', function() {
      expect(cdb).to.be.instanceof(builder.BasicColorDataBuilder)
      expect(cdb).to.be.instanceof(builder.AidedColorDataBuilder)
    })
  })
})
