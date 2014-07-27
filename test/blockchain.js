var assert = require('assert')

var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey
var networks = bitcoin.networks

var coloredcoinlib = require('../src/index')
var blockchain = coloredcoinlib.blockchain
var Transaction = coloredcoinlib.Transaction

var stubs = require('./stubs')


describe('blockchain', function() {
  var bs

  describe('BlockchainStateBase', function() {
    var tx, tx2

    beforeEach(function() {
      bs = new blockchain.BlockchainStateBase()
      tx = new Transaction()
      tx2 = new Transaction()
    })

    describe('ensureInputValues', function() {
      it('already ensured', function(done) {
        tx.ensured = true
        bs.ensureInputValues(tx, function(error, newTx) {
          expect(error).to.be.null
          expect(newTx).to.deep.equal(tx)
          done()
        })
      })

      it('isCoinbase is true', function(done) {
        tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
        bs.ensureInputValues(tx, function(error, newTx) {
          expect(error).to.be.null
          tx.ensured = true
          tx.ins[0].value = 0
          expect(newTx).to.deep.equal(tx)
          done()
        })
      })

      it('bs.getTx return error', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
        bs.getTx = stubs.getTxStub([])
        bs.ensureInputValues(tx, function(error, newTx) {
          expect(error).to.equal('notFoundTx')
          expect(newTx).to.be.null
          done()
        })
      })

      it('successful get prevTx', function(done) {
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
        tx2.addInput(tx.getId(), 0, 4294967295)
        bs.getTx = stubs.getTxStub([tx])
        bs.ensureInputValues(tx2, function(error, newTx) {
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

  describe('BlockrIOAPI', function() {
    beforeEach(function() {
      bs = new blockchain.BlockrIOAPI()
    })

    it('inherits BlockchainStateBase', function() {
      expect(bs).to.be.instanceof(blockchain.BlockchainStateBase)
      expect(bs).to.be.instanceof(blockchain.BlockrIOAPI)
    })

    describe('getBlockCount', function() {
      it('request return error', function(done) {
        bs.request = function(_, cb) { cb('error.request') }
        bs.getBlockCount(function(error, response) {
          expect(error).to.equal('error.request')
          expect(response).to.be.undefined
          done()
        })
      })

      it('blockCount is not number', function(done) {
        bs.request = function(_, cb) { cb(null, {}) }
        bs.getBlockCount(function(error, response) {
          expect(error).to.be.instanceof(assert.AssertionError)
          expect(response).to.be.undefined
          done()
        })
      })

      it('return blockCount', function(done) {
        bs.getBlockCount(function(error, response) {
          expect(error).to.be.null
          expect(response).to.be.a('number')
          expect(response).to.be.at.least(0)
          done()
        })
      })
    })

    describe('getTx', function() {
      it('request return error', function(done) {
        bs.request = function(_, cb) { cb('error.request') }
        bs.getTx('0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098', function(error, response) {
          expect(error).to.equal('error.request')
          expect(response).to.be.undefined
          done()
        })
      })

      it('Transaction.fromHex throw error', function(done) {
        bs.request = function(_, cb) { cb(null, {tx: {hex: null}}) }
        bs.getTx('0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098', function(error, tx) {
          expect(error).to.be.instanceof(TypeError)
          expect(tx).to.be.undefined
          done()
        })
      })

      it('from mainnet', function(done) {
        bs.getTx('0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098', function(error, tx) {
          expect(error).to.be.null
          expect(tx.toHex()).to.equal('\
01000000010000000000000000000000000000000000000000000000000000000000000000fffff\
fff0704ffff001d0104ffffffff0100f2052a0100000043410496b538e853519c726a2c91e61ec1\
1600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf6\
21e73a82cbf2342c858eeac00000000')
          done()
        })
      })

      it('from testnet', function(done) {
        bs = new blockchain.BlockrIOAPI({ isTestnet: true })
        bs.getTx('f0315ffc38709d70ad5647e22048358dd3745f3ce3874223c80a7c92fab0c8ba', function(error, tx) {
          expect(error).to.be.null
          expect(tx.toHex()).to.equal('\
01000000010000000000000000000000000000000000000000000000000000000000000000fffff\
fff0e0420e7494d017f062f503253482fffffffff0100f2052a010000002321021aeaf2f8638a12\
9a3156fbe7e5ef635226b0bafd495ff03afe2c843d7e3a4b51ac00000000')
          done()
        })
      })
    })

    describe('getUTXO', function() {
      var address0 = '198aMn6ZYAczwrE5NvNTUMyJ5qkfy4g3Hi'

      it('request return error', function(done) {
        bs.request = function(_, cb) { cb('error.request') }
        bs.getUTXO(address0, function(error, response) {
          expect(error).to.equal('error.request')
          expect(response).to.be.undefined
          done()
        })
      })

      it('response address not matched', function(done) {
        bs.request = function(_, cb) { cb(null, {}) }
        bs.getUTXO(address0, function(error, response) {
          expect(error).to.be.instanceof(Error)
          expect(response).to.be.undefined
          done()
        })
      })

      it('bad txOut value', function(done) {
        var unspent = [{
          tx: '49d17f0b622d2bf9250899357cf035d39dfec1f9667c045232b8eb8c7857db8b',
          amount: 'x.00',
          n: 0,
          confirmations: 1
        }]
        bs.request = function(_, cb) { cb(null, { address: address0, unspent: unspent }) }
        bs.getUTXO(address0, function(error, response) {
          expect(error).to.be.instanceof(TypeError)
          expect(response).to.be.undefined
          done()
        })
      })

      it('utxo', function(done) {
        bs.getUTXO(address0, function(error, response) {
          expect(error).to.be.null
          var values = response.map(function(utxo) { return utxo.value })
          var totalValue = values.reduce(function(acc, current) { return acc + current }, 0)
          expect(totalValue).to.equal(800000022346)
          done()
        })
      })
    })
  })
})
