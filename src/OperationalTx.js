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
  throw new Error('getTargets not implemented')
}

/**
 * Returns a Array of UTXO objects with whose colordef is the same as colorvValue
 *  and have a sum colorvalues have at least the colorValue
 * For uncolored coins sum of values of UTXO objects must also include
 *  a fee (usually it is ComposedTx)
 *
 * @abstract
 * @param {ColorValue} colorValue
 * @param {?Object} [feeEstimator=null]
 * @param {function} cb
 */
OperationalTx.prototype.selectCoins = function() {
  throw new Error('selectCoins not implemented')
}

/**
 * Returns an address which can be used as a change for given colorDefinition
 *
 * @abstract
 * @param {ColorDefinition} colorDefinition
 * @return {string}
 */
OperationalTx.prototype.getChangeAddress = function() {
  throw new Error('getChangeAddress not implemented')
}

/**
 * Returns ColorValue object representing the fee for a certain tx size
 *
 * @abstract
 * @param {number} txSize
 * @return {ColorValue}
 */
OperationalTx.prototype.getRequiredFee = function() {
  throw new Error('getRequiredFee not implemented')
}

/**
 * Returns ColorValue object representing smallest satoshi value
 *  which isn't dust according to current parameters
 *
 * @abstract
 * @return {number}
 */
OperationalTx.prototype.getDustThreshold = function() {
  throw new Error('getDustThreshold not implemented')
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
