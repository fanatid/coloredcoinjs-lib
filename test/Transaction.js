var expect = require('chai').expect
var bitcoin = require('bitcoinjs-lib')

var cclib = require('../src/index')
var Transaction = cclib.Transaction

var stubs = require('./stubs')


describe('Transaction', function() {
  var tx, tx2, newTx

  beforeEach(function() {
    tx = new Transaction()
    tx2 = new Transaction()
  })

  it('inherits bitcoinjs-lib.Transaction', function() {
    expect(tx).to.be.instanceof(bitcoin.Transaction)
    expect(tx).to.be.instanceof(Transaction)
  })

  describe('isTxId', function() {
    it('not string', function() {
      expect(Transaction.isTxId(1)).to.be.false
    })

    it('not 64 symbols', function() {
      expect(Transaction.isTxId('0000111122223333444455556666777788889999aaaabbbbcCCcddddeeeefff')).to.be.false
    })

    it('not hex', function() {
      expect(Transaction.isTxId('0000111122223333444455556666777788889999aaaabbbbccccddddeeeefffZ')).to.be.false
    })

    it('return true', function() {
      expect(Transaction.isTxId('0000111122223333444455556666777788889999aaaabbbbccccdddDEeeeFFff')).to.be.true
    })
  })

  describe('fromBuffer', function() {
    it('return Transaction', function() {
      newTx = Transaction.fromBuffer(tx.toBuffer())
      expect(newTx).to.be.instanceof(Transaction)
      expect(newTx).to.deep.equal(tx)
    })
  })

  describe('fromHex', function() {
    it('return Transaction', function() {
      newTx = Transaction.fromHex(tx.toHex())
      expect(newTx).to.be.instanceof(Transaction)
      expect(newTx).to.deep.equal(tx)
    })
  })

  describe('clone', function() {
    it('return Transaction', function() {
      expect(tx.clone()).to.be.instanceof(Transaction)
    })

    it('not ensured', function() {
      expect(tx.clone()).to.deep.equal(tx)
    })

    it('ensured', function() {
      tx.ensured = true
      tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      tx.ins[0].value = 0
      tx.ins[0].prevTx = new Transaction()
      expect(tx.clone()).to.deep.equal(tx)
    })
  })

  describe('ensureInputValues', function() {
    it('already ensured', function(done) {
      tx.ensured = true
      tx.ensureInputValues(stubs.getTxStub([]), function(error, newTx) {
        expect(error).to.be.null
        expect(newTx).to.deep.equal(tx)
        done()
      })
    })

    it('isCoinbase is true', function(done) {
      tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      tx.ensureInputValues(stubs.getTxStub([]), function(error, newTx) {
        expect(error).to.be.null
        tx.ensured = true
        tx.ins[0].value = 0
        expect(newTx).to.deep.equal(tx)
        done()
      })
    })

    it('bs.getTx return error', function(done) {
      tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
      tx.ensureInputValues(stubs.getTxStub([]), function(error, newTx) {
        expect(error).to.be.instanceof(Error).with.to.have.property('message', 'notFoundTx')
        expect(newTx).to.be.undefined
        done()
      })
    })

    it('successful get prevTx', function(done) {
      tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
      tx2.addInput(tx.getId(), 0, 4294967295)
      tx2.ensureInputValues(stubs.getTxStub([tx]), function(error, newTx) {
        expect(error).to.be.null
        tx2.ensured = true
        tx2.ins[0].prevTx = tx.clone()
        tx2.ins[0].value = tx2.ins[0].prevTx.outs[0].value
        expect(newTx).to.deep.equal(tx2)
        done()
      })
    })
  })
})
