var inherits = require('util').inherits

var cclib = require('../')
var getUncolored = cclib.definitions.Manager.getUncolored
var ColorValue = cclib.ColorValue

var transactions = require('./fixtures/transactions.json')

/**
 * Stub for testing fee related method
 *
 * @class FeeOperationalTx
 * @extends OperationalTx
 * @param {number} feeSize
 */
function FeeOperationalTx (feeSize) {
  cclib.OperationalTx.call(this)
  this.feeSize = new ColorValue(getUncolored(), feeSize)
}

inherits(FeeOperationalTx, cclib.tx.Operational)

FeeOperationalTx.prototype.getRequiredFee = function () {
  return this.feeSize
}

/**
 * @callback getTxFn~callback
 * @param {?Error} error
 * @param {string} rawTx
 */

/**
 * @param {string} txid
 * @param {getTxFn~callback} cb
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
  FeeOperationalTx: FeeOperationalTx,
  getTxFn: getTxFn
}
