var assert = require('assert')

var _ = require('lodash')

var Transaction = require('../tx').Transaction


/**
 * @class BlockchainStateBase
 */
function BlockchainStateBase() {}

/**
 * Get previous transaction for all tx.ins and
 *  return new transaction via callback cb
 *
 * @param {Transaction} tx
 * @param {function} cb Called on finished with params (error, Transaction|null)
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


module.exports = BlockchainStateBase
