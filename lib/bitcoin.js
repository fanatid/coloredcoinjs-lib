/* globals Promise:true */
var Promise = require('bluebird')
var _ = require('lodash')

var bitcoin = require('bitcoinjs-lib')

var transactionClone = bitcoin.Transaction.prototype.clone

/**
 * @return {external:bitcoinjs-lib.Transaction}
 */
bitcoin.Transaction.prototype.clone = function () {
  var self = this

  var tx = transactionClone.apply(self, Array.prototype.slice.call(arguments))

  if (!_.isUndefined(self.ensured)) {
    tx.ensured = self.ensured
  }

  tx.ins = tx.ins.map(function (input, index) {
    if (!_.isUndefined(self.ins[index].value)) {
      input.value = self.ins[index].value
    }

    if (!_.isUndefined(self.ins[index].prevTx)) {
      input.prevTx = self.ins[index].prevTx
    }

    return input
  })

  return tx
}

/** @constant {string} */
var ZeroHash = _.range(64).map(function () { return 0 }).join('')

/**
 * Check input as coinbase
 *
 * @param {object} input One of the inputs of the transaction
 * @param {Buffer} input.hash
 * @param {number} input.index
 * @return {boolean}
 */
function isCoinbase (input) {
  return input.hash.toString('hex') === ZeroHash && input.index === 4294967295
}

/**
 * @callback Transaction~ensureInputValuesCallback
 * @param {?Error} err
 * @param {external:bitcoinjs-lib.Transaction} tx
 */

/**
 * Get transactions for all inputs and return new transaction
 *    with prevTx and value filds in inputs
 *
 * @param {getTxFn} getTxFn
 * @param {Transaction~ensureInputValuesCallback} cb
 */
bitcoin.Transaction.prototype.ensureInputValues = function (getTxFn, cb) {
  var getTx = Promise.promisify(getTxFn)

  var self = this
  return Promise.try(function () {
    var tx = self.clone()
    if (tx.ensured === true) {
      return tx
    }

    return Promise.map(tx.ins, function (input) {
      if (isCoinbase(input)) {
        input.prevTx = null
        input.value = 0
        return
      }

      // !
      var txId = bitcoin.util.hashEncode(input.hash)
      return getTx(txId)
        .then(function (rawtx) {
          var prevTx = bitcoin.Transaction.fromHex(rawtx)
          input.prevTx = prevTx
          input.value = prevTx.outs[input.index].value
        })
    })
    .then(function () {
      tx.ensured = true
      return tx
    })
  })
  .asCallback(cb)
}

module.exports = bitcoin
