var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var blockchain = coloredcoinlib.blockchain
var builder = coloredcoinlib.builder
var colordef = coloredcoinlib.colordef
var store = coloredcoinlib.store
var Transaction = coloredcoinlib.Transaction

var stubs = require('./stubs')


describe('builder', function() {
  var epobc, cdstore, bs, tx, tx2, cdbuilder

  beforeEach(function() {
    epobc = new colordef.EPOBCColorDefinition(1,
      { txId: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', outIndex: 0, height: 0 })
    cdstore = new store.ColorDataStore()
    bs = new blockchain.BlockchainStateBase()
    tx = new Transaction()
    tx2 = new Transaction()
  })

  describe('BasicColorDataBuilder', function() {
    beforeEach(function() {
      cdbuilder = new builder.BasicColorDataBuilder(epobc, cdstore, bs)
    })

    afterEach(function() {
      cdstore.removeAll()
    })

    describe('scanTx', function() {
      it('ColorDataStore not empty', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 1, 37)
        cdstore.add({
          colorId: 1,
          txId: '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
          outIndex: 1,
          value: 1
        })
        cdbuilder.scanTx(tx, [], function(error) {
          expect(error).to.be.null
          done()
        })
      })

      it('runKernel return error', function(done) {
        epobc.runKernel = function(_, _, _, cb) { cb('error.runKernel') }
        epobc.genesis.txId = tx.getId()
        cdbuilder.scanTx(tx, [], function(error) {
          expect(error).to.equal('error.runKernel')
          done()
        })
      })

      it('index not in outputIndices', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        tx2.addInput(tx.getId(), 0, 51 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        bs.getTx = stubs.getTxStub([tx])
        cdstore.add({
          colorId: 1,
          txId: '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
          outIndex: 0,
          value: 6
        })
        cdbuilder.scanTx(tx2, [], function(error) {
          expect(error).to.be.null
          done()
        })
      })

      it('ColorDataStore.add throw error', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        tx2.addInput(tx.getId(), 0, 51 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        bs.getTx = stubs.getTxStub([tx])
        cdstore.add({ colorId: 1, txId: tx.getId(), outIndex: 0, value: 6 })
        cdstore.add = function() { throw new Error('error.scanTx') }
        cdbuilder.scanTx(tx2, [0], function(error) {
          expect(error).to.deep.equal(new Error('error.scanTx'))
          done()
        })
      })

      it('add record', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        tx2.addInput(tx.getId(), 0, 51 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        bs.getTx = stubs.getTxStub([tx])
        cdstore.add({ colorId: 1, txId: tx.getId(), outIndex: 0, value: 6 })
        cdbuilder.scanTx(tx2, [0], function(error) {
          expect(error).to.be.null
          var record = cdstore.get({
            colorId: 1,
            txId: tx2.getId(),
            outIndex: 0
          })
          expect(record.value).to.equal(6)
          done()
        })
      })
    })
  })

  describe('AidedColorDataBuilder', function() {
    beforeEach(function() {
      cdbuilder = new builder.AidedColorDataBuilder(epobc, cdstore, bs)
    })

    it('inherits BasicColorDataBuilder', function() {
      expect(cdbuilder).to.be.instanceof(builder.BasicColorDataBuilder)
      expect(cdbuilder).to.be.instanceof(builder.AidedColorDataBuilder)
    })
  })
})
