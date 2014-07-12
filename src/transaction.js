var _ = require('underscore')
var inherits = require('inherits')
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

// Copy from bitcoinjs-lib.Transaction
Transaction.DEFAULT_SEQUENCE = bitcoin.Transaction.DEFAULT_SEQUENCE
Transaction.SIGHASH_ALL = bitcoin.Transaction.SIGHASH_ALL
Transaction.SIGHASH_NONE = bitcoin.Transaction.SIGHASH_NONE
Transaction.SIGHASH_SINGLE = bitcoin.Transaction.SIGHASH_SINGLE
Transaction.SIGHASH_ANYONECANPAY = bitcoin.Transaction.SIGHASH_ANYONECANPAY

Transaction.fromBuffer = bitcoin.Transaction.fromBuffer
Transaction.fromHex = bitcoin.Transaction.fromHex

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
