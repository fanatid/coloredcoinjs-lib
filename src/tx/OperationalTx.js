/**
 * @class OperationalTx
 */
function OperationalTx() {}

/**
 * Returns a array of ColorTargets
 *
 * @return {Array}
 */
OperationalTx.prototype.getTargets = function() {
  throw new Error('not implemented')
}

/**
 * Returns a Array of UTXO objects with whose colordef is the same as colorvValue
 *  and have a sum colorvalues have at least the colorValue
 * For uncolored coins sum of values of UTXO objects must also include
 *  a fee (usually it is ComposedTx)
 *
 * @param {ColorValue}
 * @param {Object|null} [feeEstimator=null]
 * @param {function} cb
 */
OperationalTx.prototype.selectCoins = function(colorValue, feeEstimator, cb) {
  throw new Error('not implemented')
}

/**
 * Returns an address which can be used as a change for given colorDefinition
 *
 * @param {ColorDefinition}
 * @return {string}
 */
OperationalTx.prototype.getChangeAddr = function(colorDefinition) {
  throw new Error('not implemented')
}

/**
 * Returns ColorValue object representing the fee for a certain tx size
 *
 * @param {number} txSize
 * @return {ColorValue}
 */
OperationalTx.prototype.getRequiredFee = function(txSize) {
  throw new Error('not implemented')
}

/**
 * Returns ColorValue object representing smallest satoshi value
 *  which isn't dust according to current parameters
 *
 * @return {number}
 */
OperationalTx.prototype.getDustThreshold = function() {
  throw new Error('not implemented')
}

/**
 * Create ComposedTx from current OperationalTx
 *
 * @return {ComposedTx}
 */
OperationalTx.prototype.makeComposedTx = function() {
  var ComposedTx = require('./ComposedTx')
  return new ComposedTx(this)
}


module.exports = OperationalTx
