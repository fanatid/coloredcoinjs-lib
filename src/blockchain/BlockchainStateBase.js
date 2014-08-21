var assert = require('assert')

var _ = require('lodash')
var Q = require('q')

var Transaction = require('../tx').Transaction


/**
 * @class BlockchainStateBase
 */
function BlockchainStateBase() {}

/**
 * @callback BlockchainStateBase~ensureInputValues
 * @param {?Error} error
 * @param {Transaction} tx
 */

/**
 * Get previous transaction for all tx.ins and
 *  return new transaction via callback cb
 *
 * @param {Transaction} tx
 * @param {BlockchainStateBase~ensureInputValues} cb
 */
BlockchainStateBase.prototype.ensureInputValues = function(tx, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var self = this

  Q.fcall(function() {
    tx = tx.clone()
    if (tx.ensured === true)
      return tx

    function processOne(index) {
      if (index === tx.ins.length) {
        tx.ensured = true
        return tx
      }

      var isCoinbase = (
        tx.ins[index].hash.toString('hex') === '0000000000000000000000000000000000000000000000000000000000000000' &&
        tx.ins[index].index === 4294967295)

      if (isCoinbase) {
        tx.ins[index].value = 0
        return processOne(index+1)
      }

      var txId = Array.prototype.reverse.call(new Buffer(tx.ins[index].hash)).toString('hex')

      return Q.ninvoke(self, 'getTx', txId)
        .then(function(prevTx) {
          tx.ins[index].prevTx = prevTx
          tx.ins[index].value = prevTx.outs[tx.ins[index].index].value
          return processOne(index+1)
        })
    }

    return processOne(0)

  }).done(function(tx) { cb(null, tx) }, function(error) { cb(error) })
}

/**
 * @callback BlockchainStateBase~getBlockCount
 * @param {?Error} error
 * @param {number} blockCount
 */

/**
 * Get block count in blockchain
 * @abstract
 * @param {BlockchainStateBase~getBlockCount} cb
 */
BlockchainStateBase.prototype.getBlockCount = function() {
  throw new Error('getBlockCount not implemented')
}

/**
 * @callback BlockchainStateBase~getTx
 * @param {?Error} error
 * @param {Transaction} tx
 */

/**
 * Get transaction by txId
 * @abstract
 * @param {string} txId
 * @param {BlockchainStateBase~getTx} cb
 */
BlockchainStateBase.prototype.getTx = function() {
  throw new Error('getTx not implemented')
}

/**
 * @callback BlockchainStateBase~sendTx
 * @param {?Error} error
 * @param {string} txId
 */

/**
 * Send transaction tx to server which broadcast tx to network
 * @abstract
 * @param {Transaction} tx
 * @param {BlockchainStateBase~sendTx} cb
 */
BlockchainStateBase.prototype.sendTx = function() {
  throw new Error('sendTx not implemented')
}

/**
 * @typedef UTXO
 * @type {Object}
 * @property {string} txId Transaction id
 * @property {number} outIndex Output index
 * @property {number} value Coin value in satoshi
 * @property {number} confrimations Number of transaction confirmation
 */

/**
 * @callback BlockchainStateBase~getUTXO
 * @param {?Error} error
 * @param {UTXO[]} utxo
 */

/**
 * Get UTXO for given address
 * @abstract
 * @param {string} address
 * @param {BlockchainStateBase~getUTXO} cb
 */
BlockchainStateBase.prototype.getUTXO = function() {
  throw new Error('getUTXO not implemented')
}

/**
 * @typedef HistoryObject
 * @type {Object}
 * @property {string} txId
 * @property {number} confirmations
 */

/**
 * @callback BlockchainStateBase~getHistory
 * @param {?Error} error
 * @param {HistoryObject} records
 */

/**
 * Get transaction Ids for given address
 * @abstract
 * @param {string} address
 * @param {BlockchainStateBase~getHistory} cb
 */
BlockchainStateBase.prototype.getHistory = function() {
  throw new Error('getUTXO not implemented')
}


module.exports = BlockchainStateBase
