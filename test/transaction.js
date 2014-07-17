var expect = require('chai').expect
var bitcoin = require('bitcoinjs-lib')

var coloredcoinlib = require('../src/index')
var Transaction = coloredcoinlib.Transaction


describe('transaction', function() {
  var tx, newTx

  beforeEach(function() {
    tx = new Transaction()
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

  describe('clone', function() {
    it('not ensured', function() {
      expect(tx.clone()).to.deep.equal(tx)
    })

    it('ensured', function() {
      tx.ensured = true
      tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      tx.ins[0].value = 0
      tx.ins[0].prevTx = new Transaction()
      tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
      expect(tx.clone()).to.deep.equal(tx)
    })
  })
})
