var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var blockchain = coloredcoinlib.blockchain
var builder = coloredcoinlib.builder
var colordef = coloredcoinlib.colordef
var store = coloredcoinlib.store
var Transaction = coloredcoinlib.Transaction


describe('builder', function() {
  var epobc, cdstore, bs, tx, tx2, cdbuilder

  beforeEach(function() {
    epobc = new colordef.EPOBCColorDefinition(1, { txHash: 'genesis', outIndex: 0, height: 0 })
    cdstore = new store.ColorDataStore('memory')
    bs = new blockchain.BlockchainStateBase()
    tx = new Transaction()
    tx2 = new Transaction()
  })

  describe('BasicColorDataBuilder', function() {
    beforeEach(function() {
      cdbuilder = new builder.BasicColorDataBuilder(epobc, cdstore, bs)
    })

    describe('scanTx', function() {
      it('ColorDataStore.get return error', function(done) {
        tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
        cdstore.get = function(_, _, _, cb) { cb('myError') }
        cdbuilder.scanTx(tx, [], function(error) {
          expect(error).to.equal('myError')
          done()
        })
      })

      it('ColorDataStore empty and not isSpecialTx', function(done) {
        cdbuilder.scanTx(tx, [], function(error) {
          expect(error).to.be.null
          done()
        })
      })

      it('ColorDataStore not empty', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 1, 37)
        cdstore.add(1, '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 1, 1, function(error) {
          expect(error).to.be.null
          cdbuilder.scanTx(tx, [], function(error) {
            expect(error).to.be.null
            done()
          })
        })
      })

      it('runKernel return error', function(done) {
        epobc.runKernel = function(_, _, _, cb) { cb('myError') }
        epobc.genesis.txHash = tx.getId()
        cdbuilder.scanTx(tx, [], function(error) {
          expect(error).to.equal('myError')
          done()
        })
      })

      it('index not in outputIndices', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        bs.getTx = function(txHash, cb) { cb(null, tx2) }
        cdstore.add(1, '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 6, function(error) {
          expect(error).to.be.null
          cdbuilder.scanTx(tx, [], function(error) {
            expect(error).to.be.null
            done()
          })
        })
      })

      it('ColorDataStore.add return error', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        bs.getTx = function(txHash, cb) { cb(null, tx2) }
        cdstore.add(1, '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 6, function(error) {
          expect(error).to.be.null
          cdstore.add = function(_, _, _, _, cb) { cb('myError') }
          cdbuilder.scanTx(tx, [0], function(error) {
            expect(error).to.equal('myError')
            done()
          })
        })
      })

      it('add record', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        bs.getTx = function(txHash, cb) { cb(null, tx2) }
        cdstore.add(1, '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 6, function(error) {
          expect(error).to.be.null
          cdbuilder.scanTx(tx, [0], function(error) {
            expect(error).to.be.null
            cdstore.get(1, tx.getId(), 0, function(error, record) {
              expect(error).to.be.null
              expect(record.value).to.equal(6)
              done()
            })
          })
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
