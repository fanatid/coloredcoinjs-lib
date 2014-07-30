var expect = require('chai').expect
var bitcoin = require('bitcoinjs-lib')

var coloredcoinlib = require('../src/index')
var Transaction = coloredcoinlib.Transaction


describe('Transaction', function() {
  var tx, newTx

  beforeEach(function() {
    tx = new Transaction()
    tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
    tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
    tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
  })

  it('inherits bitcoinjs-lib.Transaction', function() {
    expect(tx).to.be.instanceof(bitcoin.Transaction)
    expect(tx).to.be.instanceof(Transaction)
  })

  describe('isTxId', function() {
    beforeEach(function() {
      tx = new Transaction()
    })

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
      var newTx = Transaction.fromBuffer(tx.toBuffer())
      expect(newTx).to.be.instanceof(Transaction)
      expect(newTx).to.deep.equal(tx)
    })
  })

  describe('fromHex', function() {
    it('return Transaction', function() {
      var newTx = Transaction.fromHex(tx.toHex())
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
      tx.ins[0].value = 0
      tx.ins[0].prevTx = new Transaction()
      expect(tx.clone()).to.deep.equal(tx)
    })
  })
})
