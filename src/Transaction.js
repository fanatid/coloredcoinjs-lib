var inherits = require('util').inherits

var _ = require('lodash')

var bitcoin = require('bitcoinjs-lib')


/**
 * @class Transaction
 *
 * Inherits bitcoinjs-lib.Transaction
 */
function Transaction() {
  bitcoin.Transaction.call(this)
}

inherits(Transaction, bitcoin.Transaction)

/**
 * Check txId is 32 bytes hex string
 *
 * @param {string} txId
 * @return {boolean}
 */
Transaction.isTxId = function(txId) {
  var set = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']

  return (_.isString(txId) &&
          txId.length === 64 &&
          txId.toLowerCase().split('').every(function(x) { return set.indexOf(x) !== -1 }))
}


// Copy from bitcoinjs-lib.Transaction
Transaction.DEFAULT_SEQUENCE = bitcoin.Transaction.DEFAULT_SEQUENCE
Transaction.SIGHASH_ALL = bitcoin.Transaction.SIGHASH_ALL
Transaction.SIGHASH_NONE = bitcoin.Transaction.SIGHASH_NONE
Transaction.SIGHASH_SINGLE = bitcoin.Transaction.SIGHASH_SINGLE
Transaction.SIGHASH_ANYONECANPAY = bitcoin.Transaction.SIGHASH_ANYONECANPAY

Transaction.fromBuffer = function(buffer) {
  var tx = bitcoin.Transaction.fromBuffer(buffer)

  var newTx = new Transaction()
  newTx.version = tx.version
  newTx.locktime = tx.locktime
  newTx.ins = tx.ins
  newTx.outs = tx.outs

  return newTx
}

Transaction.fromHex = function(hex) {
  return Transaction.fromBuffer(new Buffer(hex, 'hex'))
}

Transaction.prototype.clone = function() {
  var newTx = new Transaction()
  newTx.version = this.version
  newTx.locktime = this.locktime
  if (!_.isUndefined(this.ensured))
    newTx.ensured = this.ensured

  newTx.ins = this.ins.map(function(txin) {
    var input = {
      hash: txin.hash,
      index: txin.index,
      script: txin.script,
      sequence: txin.sequence
    }

    if (!_.isUndefined(txin.value))
      input.value = txin.value
    if (!_.isUndefined(txin.prevTx))
      input.prevTx = txin.prevTx

    return input
  })

  newTx.outs = this.outs.map(function(txout) {
    return {
      script: txout.script,
      value: txout.value
    }
  })

  return newTx
}


module.exports = Transaction
