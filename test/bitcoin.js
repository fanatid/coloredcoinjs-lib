var expect = require('chai').expect
var bitcoin = require('bitcoinjs-lib')

var cclib = require('../src/index')
var Script = cclib.bitcoin.Script
var Transaction = cclib.bitcoin.Transaction

var stubs = require('./stubs')


describe('bitcoin.util.getAddressesFromScript', function () {
  var script
  var addresses

  it('pubkeyhash', function () {
    script = 'OP_DUP OP_HASH160 e004d13bb19caa402ab2de0418a784a8e3d0ce66 OP_EQUALVERIFY OP_CHECKSIG'
    script = Script.fromASM(script)
    addresses = bitcoin.util.getAddressesFromScript(script, bitcoin.networks.testnet)
    expect(addresses).to.deep.equal(['n1wTRjhqpRJ6faZtc1E3Y8xaHR21fzqJ4n'])
  })

  it('pubkey', function () {
    script = '02114842249da6ef0d22f0b943ecbfa61ca4b256850a337063b89ebe32f27b641e OP_CHECKSIG'
    script = Script.fromASM(script)
    addresses = bitcoin.util.getAddressesFromScript(script, bitcoin.networks.testnet)
    expect(addresses).to.deep.equal(['n1wTRjhqpRJ6faZtc1E3Y8xaHR21fzqJ4n'])
  })

  it('multisig', function () {
    script = 'OP_2 02130362e2687bb6d090119aec775325326ce16bb333e58887324e1c04a83b754f ' +
'02d8ec154637422ae2b8d5fe58f375bdc74feb54164ccd57d0f91b12a0c4f8b434 OP_2 OP_CHECKMULTISIG'
    script = Script.fromASM(script)
    addresses = bitcoin.util.getAddressesFromScript(script, bitcoin.networks.testnet)
    expect(addresses).to.deep.equal(['n11rxder79nUtQuvNpLyUBkTTuP9acFydy', 'n2Q119tNwnCopKDn1cyLaAzNAbSSWTfWSb'])
  })

  it('scripthash', function () {
    script = 'OP_HASH160 e004d13bb19caa402ab2de0418a784a8e3d0ce66 OP_EQUAL'
    script = Script.fromASM(script)
    addresses = bitcoin.util.getAddressesFromScript(script, bitcoin.networks.testnet)
    expect(addresses).to.deep.equal(['2NDfj7y3LAkgaBRRFgfY8ko6SnHvC2gYdyb'])
  })
})

describe('bitcoin.Transaction', function () {
  var tx
  var tx2
  var newTx

  beforeEach(function () {
    tx = new Transaction()
    tx2 = new Transaction()
  })

  it('inherits bitcoinjs-lib.Transaction', function () {
    expect(tx).to.be.instanceof(bitcoin.Transaction)
    expect(tx).to.be.instanceof(Transaction)
  })

  describe.skip('isTxId', function () {
    it('not string', function () {
      expect(Transaction.isTxId(1)).to.be.false
    })

    it('not 64 symbols', function () {
      expect(Transaction.isTxId('0000111122223333444455556666777788889999aaaabbbbcCCcddddeeeefff')).to.be.false
    })

    it('not hex', function () {
      expect(Transaction.isTxId('0000111122223333444455556666777788889999aaaabbbbccccddddeeeefffZ')).to.be.false
    })

    it('return true', function () {
      expect(Transaction.isTxId('0000111122223333444455556666777788889999aaaabbbbccccdddDEeeeFFff')).to.be.true
    })
  })

  describe('fromBuffer', function () {
    it('return Transaction', function () {
      newTx = Transaction.fromBuffer(tx.toBuffer())
      expect(newTx).to.be.instanceof(Transaction)
      expect(newTx).to.deep.equal(tx)
    })
  })

  describe('fromHex', function () {
    it('return Transaction', function () {
      newTx = Transaction.fromHex(tx.toHex())
      expect(newTx).to.be.instanceof(Transaction)
      expect(newTx).to.deep.equal(tx)
    })
  })

  describe('clone', function () {
    it('return Transaction', function () {
      expect(tx.clone()).to.be.instanceof(Transaction)
    })

    it('not ensured', function () {
      expect(tx.clone()).to.deep.equal(tx)
    })

    it('ensured', function () {
      tx.ensured = true
      tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      tx.ins[0].value = 0
      tx.ins[0].prevTx = new Transaction()
      expect(tx.clone()).to.deep.equal(tx)
    })
  })

  describe('ensureInputValues', function () {
    it('already ensured', function (done) {
      tx.ensured = true
      tx.ensureInputValues(stubs.getTxStub([]), function (error, newTx) {
        expect(error).to.be.null
        expect(newTx).to.deep.equal(tx)
        done()
      })
    })

    it('isCoinbase is true', function (done) {
      tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      tx.ensureInputValues(stubs.getTxStub([]), function (error, newTx) {
        expect(error).to.be.null
        tx.ensured = true
        tx.ins[0].prevTx = null
        tx.ins[0].value = 0
        expect(newTx).to.deep.equal(tx)
        done()
      })
    })

    it('bs.getTx return error', function (done) {
      tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
      tx.ensureInputValues(stubs.getTxStub([]), function (error, newTx) {
        expect(error).to.be.instanceof(Error).with.to.have.property('message', 'notFoundTx')
        expect(newTx).to.be.undefined
        done()
      })
    })

    it('successful get prevTx', function (done) {
      tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
      tx2.addInput(tx.getId(), 0, 4294967295)
      tx2.ensureInputValues(stubs.getTxStub([tx]), function (error, newTx) {
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
