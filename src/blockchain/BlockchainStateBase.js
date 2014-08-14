var assert = require('assert')

var _ = require('lodash')

var Transaction = require('../tx').Transaction


/**
 * @class BlockchainStateBase
 */
function BlockchainStateBase() {}

/**
 * @callback BlockchainStateBase~ensureInputValues
 * @param {Error|null} error
 * @param {Transaction} tx
 */

/**
 * Get previous transaction for all tx.ins and
 *  return new transaction via callback cb
 *
 * @param {Transaction} tx
 * @param {BlockchainStateBase~ensureInputValues}
 */
BlockchainStateBase.prototype.ensureInputValues = function(tx, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  tx = tx.clone()

  if (tx.ensured === true) {
    process.nextTick(function() { cb(null, tx) })
    return
  }

  var _this = this

  function processOne(index) {
    if (index === tx.ins.length) {
      tx.ensured = true
      cb(null, tx)
      return
    }

    var isCoinbase = (
      tx.ins[index].hash.toString('hex') === '0000000000000000000000000000000000000000000000000000000000000000' &&
      tx.ins[index].index === 4294967295)

    if (isCoinbase) {
      tx.ins[index].value = 0
      processOne(index+1)

    } else {
      var txId = Array.prototype.reverse.call(new Buffer(tx.ins[index].hash)).toString('hex')

      _this.getTx(txId, function(error, prevTx) {
        if (error === null) {
          tx.ins[index].prevTx = prevTx
          tx.ins[index].value = prevTx.outs[tx.ins[index].index].value
          processOne(index+1)

        } else {
          cb(error, null)
        }
      })
    }
  }

  process.nextTick(function() { processOne(0) })
}

/**
 * @callback BlockchainStateBase~getBlockCount
 * @param {Error|null} error
 * @param {number} blockCount
 */

/**
 * Get block count in blockchain
 *
 * @param {BlockchainStateBase~getBlockCount} cb
 */
BlockchainStateBase.prototype.getBlockCount = function(cb) {
  throw new Error('not implemented')
}

/**
 * @callback BlockchainStateBase~getTx
 * @param {Error|null} error
 * @param {Transaction} tx
 */

/**
 * Get transaction by txId
 *
 * @param {string} txId
 * @param {BlockchainStateBase~getTx} cb
 */
BlockchainStateBase.prototype.getTx = function(txId, cb) {
  throw new Error('not implemented')
}

/**
 * @callback BlockchainStateBase~sendTx
 * @param {Error|null} error
 */

/**
 * Send transaction tx to server which broadcast tx to network
 *
 * @param {Transaction} tx
 * @param {BlockchainStateBase~sendTx} cb
 */
BlockchainStateBase.prototype.sendTx = function(tx, cb) {
  throw new Error('not implemented')
}

/**
 * @callback BlockchainStateBase~getUTXO
 * @param {Error|null} error
 * @param {Array} utxo Array of Objects { txId: string, outIndex: number, value: number, confrimations: number }
 */

/**
 *
 * @param {string} address
 * @param {function} cb
 */
BlockchainStateBase.prototype.getUTXO = function(address, cb) {
  throw new Error('not implemented')
}


module.exports = BlockchainStateBase
