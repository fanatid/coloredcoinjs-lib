var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')

var cclib = require('../src/index')
var stubs = require('./stubs')


describe('blockchain.BlockrIOAPI', function() {
  var bs

  beforeEach(function() {
    bs = new cclib.blockchain.BlockrIOAPI()
  })

  it('inherits BlockchainStateBase', function() {
    expect(bs).to.be.instanceof(cclib.blockchain.BlockchainStateBase)
    expect(bs).to.be.instanceof(cclib.blockchain.BlockrIOAPI)
  })

  describe('request', function() {
    it('request timeout', function(done) {
      bs.requestPathCacheMaxAge = 1
      bs.getBlockCount(function(error, response) {
        expect(error).to.be.instanceof(Error)
        expect(response).to.be.undefined
        done()
      })
    })
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
        expect(error).to.be.instanceof(Error)
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
        expect(error).to.be.instanceof(Error)
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
      bs = new cclib.blockchain.BlockrIOAPI({ testnet: true })
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

  describe('sendTx', function() {
    var hdnode = bitcoin.HDNode.fromSeedHex('00000000000000000000000000000000', bitcoin.networks.testnet)
    // address is mhW9PYb5jsjpsS5x6dcLrZj7gPvw9mMb9c
    var address = hdnode.pubKey.getAddress(bitcoin.networks.testnet).toBase58Check()

    it('send coins', function(done) {
      bs = new cclib.blockchain.BlockrIOAPI({ testnet: true })
      bs.getUTXO(address, function(error, response) {
        expect(error).to.be.null
        expect(response).to.be.instanceof(Array).with.to.have.length.least(1)
        var totalValue = response.reduce(function(a, b) { return { value: a.value+b.value } }).value
        expect(totalValue).to.be.at.least(15500)

        // send totalValue minus 0.1 mBTC to mhW9PYb5jsjpsS5x6dcLrZj7gPvw9mMb9c
        var tx = new cclib.tx.Transaction()
        response.forEach(function(unspent) {
          tx.addInput(unspent.txId, unspent.outIndex)
        })
        tx.addOutput(address, totalValue - 10000)
        tx.ins.forEach(function(input, index) {
          tx.sign(index, hdnode.privKey)
        })

        bs.sendTx(tx, function(error, response) {
          expect(error).to.be.null
          expect(response).to.be.a('string').with.to.have.length(64)
          done()
        })
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
        expect(totalValue).to.equal(800000032346)
        done()
      })
    })
  })
})
