var expect = require('chai').expect

var cclib = require('../src/index')
var stubs = require('./stubs')


describe('blockchain.BlockchainStateBase', function() {
  var bs, tx1, tx2

  beforeEach(function() {
    bs = new cclib.blockchain.BlockchainStateBase()
    tx1 = new cclib.tx.Transaction()
    tx2 = new cclib.tx.Transaction()
  })

  describe('ensureInputValues', function() {
    it('already ensured', function(done) {
      tx1.ensured = true
      bs.ensureInputValues(tx1, function(error, newTx) {
        expect(error).to.be.null
        expect(newTx).to.deep.equal(tx1)
        done()
      })
    })

    it('isCoinbase is true', function(done) {
      tx1.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      bs.ensureInputValues(tx1, function(error, newTx) {
        expect(error).to.be.null
        tx1.ensured = true
        tx1.ins[0].value = 0
        expect(newTx).to.deep.equal(tx1)
        done()
      })
    })

    it('bs.getTx return error', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
      bs.getTx = stubs.getTxStub([])
      bs.ensureInputValues(tx1, function(error, newTx) {
        expect(error).to.equal('notFoundTx')
        expect(newTx).to.be.null
        done()
      })
    })

    it('successful get prevTx', function(done) {
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
      tx2.addInput(tx1.getId(), 0, 4294967295)
      bs.getTx = stubs.getTxStub([tx1])
      bs.ensureInputValues(tx2, function(error, newTx) {
        expect(error).to.be.null
        tx2.ensured = true
        tx2.ins[0].prevTx = tx1.clone()
        tx2.ins[0].value = tx2.ins[0].prevTx.outs[0].value
        expect(newTx).to.deep.equal(tx2)
        done()
      })
    })
  })
})
