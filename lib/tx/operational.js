var ColorDefinitionManager = require('../definitions/manager')
var ColorValue = require('../colorvalue')
var NotImplementedError = require('../errors').NotImplementedError

/**
 * @class OperationalTx
 */
function OperationalTx () {}

/**
 * @abstract
 * @return {ColorTarget[]}
 */
OperationalTx.prototype.getTargets = function () {
  throw new NotImplementedError('OperationalTx.getTargets')
}

/**
 * @callback OperationalTx~abstractEstimateRequiredFee
 * @param {Object} extra
 * @param {number} [extra.txIns=0]
 * @param {number} [extra.txOuts=1]
 * @param {number} [extra.bytes=0]
 * @return {number}
 */

/**
 * @typedef {Object} OperationalTx~AbstractRawCoin
 * @property {number} colorId
 * @property {string} txId
 * @property {number} outIndex
 * @property {number} value
 */

/**
 * @callback OperationalTx~AbstractCoinToRawCoin
 * @return {OperationalTx~AbstractRawCoin[]}
 */

/**
 * @typedef {Object} OperationalTx~AbstractCoin
 * @property {OperationalTx~AbstractCoinToRawCoin} toRawCoin
 */

/**
 * @callback OperationalTx~selectCoinsCallback
 * @param {?Error} err
 * @param {OperationalTx~AbstractCoin[]} utxo
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
 * @param {Object} [feeEstimator]
 * @param {OperationalTx~abstractEstimateRequiredFee} [feeEstimator.estimateRequiredFee]
 * @param {OperationalTx~selectCoinsCallback} cb
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
 * Returns ColorValue representing the fee for a certain tx size
 *
 * @param {number} txSize Transaction size in bytes
 * @param {number} [feePerKb=10000] ?
 * @return {ColorValue}
 */
OperationalTx.prototype.getRequiredFee = function (txSize, feePerKb) {
  // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/main.cpp#L53
  if (feePerKb === undefined) {
    feePerKb = 10000
  }

  // var feeValue = Math.ceil(txSize * feePerKb / 1000)

  throw new NotImplementedError('OperationalTx.getRequiredFee')
}

/**
 * Returns ColorValue representing smallest satoshi value
 *  which isn't dust according to current parameters
 *
 * @return {ColorValue}
 */
OperationalTx.prototype.getDustThreshold = function () {
  // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/core.h#L151-L162
  var uncolored = ColorDefinitionManager.getUncolored()
  return new ColorValue(uncolored, 546)
}

/**
 * @return {ComposedTx}
 */
OperationalTx.prototype.makeComposedTx = function () {
  var ComposedTx = require('./composed')
  return new ComposedTx(this)
}

module.exports = OperationalTx
