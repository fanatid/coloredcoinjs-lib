var inherits = require('util').inherits

var cclib = require('../')

var transactions = require('./fixtures/transactions.json')

/**
 * @class FixedFeeOperationalTx
 * @extends OperationalTx
 * @param {number} feeSize
 */
function FixedFeeOperationalTx (feeSize) {
  cclib.tx.Operational.call(this)

  var cdef = new cclib.definitions.Uncolored()
  this._feeSize = new cclib.ColorValue(cdef, feeSize)
}

inherits(FixedFeeOperationalTx, cclib.tx.Operational)

FixedFeeOperationalTx.prototype.getRequiredFee = function () {
  return this._feeSize
}

/**
 * @callback getTx~callback
 * @param {?Error} error
 * @param {Transaction} tx
 */

/**
 * @param {string} txid
 * @param {getTx~callback} cb
 */
function getTxFn (txid, cb) {
  var err = null
  var rawtx = transactions[txid]

  if (rawtx === undefined) {
    err = new Error('Transaction not found!')
  }

  cb(err, rawtx)
}

module.exports = {
  FixedFeeOperationalTx: FixedFeeOperationalTx,
  getTxFn: getTxFn
}
