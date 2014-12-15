var NotImplementedError = require('./errors').NotImplementedError


/**
 * @class OperationalTx
 */
function OperationalTx() {}

/**
 * @return {ColorTarget[]}
 */
OperationalTx.prototype.getTargets = function () {
  throw new NotImplementedError('OperationalTx.getTargets')
}

/**
 * @callback OperationalTx~selectCoins
 * @param {?Error} error
 * @param {{toRawCoin: function}[]} utxo
 * @param {ColorValue} utxoColorValue
 */

/**
 * Returns a Array of UTXO objects with whose colordef is the same as colorvValue
 *  and have a sum colorvalues have at least the colorValue
 * For uncolored coins sum of values of UTXO objects must also include
 *  a fee (usually it is ComposedTx)
 *
 * @abstract
 * @param {ColorValue} colorValue
 * @param {?Object} [feeEstimator]
 * @param {OperationalTx~selectCoins} cb
 */
OperationalTx.prototype.selectCoins = function () {
  throw new NotImplementedError('OperationalTx.selectCoins')
}

/**
 * Returns an address which can be used as a change for given colorDefinition
 *
 * @abstract
 * @param {ColorDefinition} colorDefinition
 * @return {string}
 */
OperationalTx.prototype.getChangeAddress = function () {
  throw new NotImplementedError('OperationalTx.getChangeAddress')
}

/**
 * Returns ColorValue object representing the fee for a certain tx size
 *
 * @abstract
 * @param {number} txSize
 * @return {ColorValue}
 */
OperationalTx.prototype.getRequiredFee = function () {
  throw new NotImplementedError('OperationalTx.getRequiredFee')
}

/**
 * Returns ColorValue object representing smallest satoshi value
 *  which isn't dust according to current parameters
 *
 * @abstract
 * @return {ColorValue}
 */
OperationalTx.prototype.getDustThreshold = function () {
  throw new NotImplementedError('OperationalTx.getDustThreshold')
}

/**
 * Create ComposedTx from current OperationalTx
 *
 * @return {ComposedTx}
 */
OperationalTx.prototype.makeComposedTx = function () {
  var ComposedTx = require('./ComposedTx')
  return new ComposedTx(this)
}


module.exports = OperationalTx
