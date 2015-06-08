var _ = require('lodash')
var Promise = require('bluebird')

var Uncolored = require('../definitions/uncolored')
var ColorValue = require('../colorvalue')
var NotImplemented = require('../errors').NotImplemented

/**
 * @class OperationalTx
 */
function OperationalTx () {
  this._targets = []
}

/**
 * @param {ColorTarget} ctarget
 */
OperationalTx.prototype.addTarget = function (target) {
  this.addTargets([target])
}

/**
 * @param {ColorTarget[]} targets
 */
OperationalTx.prototype.addTargets = function (targets) {
  var self = this
  targets.forEach(function (target) { self._targets.push(target) })
}

/**
 * @return {ColorTarget[]}
 */
OperationalTx.prototype.getTargets = function () {
  return this._targets.slice()
}

/**
 * @return {boolean}
 */
OperationalTx.prototype.isMonoColor = function () {
  var cids = _.invoke(this._targets, 'getColorId')
  return _.uniq(cids).length <= 1
}

/**
 * @callback FeeEstimator~estimateRequiredFee
 * @param {Object} extra
 * @param {number} [extra.inputs]
 * @param {number} [extra.outputs]
 * @param {number} [extra.bytes]
 * @return {number}
 */

/**
 * @typedef {Object} FeeEstimator
 * @property {FeeEstimator~estimateRequiredFee} estimateRequiredFee
 */

/**
 * @typedef {Object} OperationalTx~AbstractRawCoin
 * @property {string} txid
 * @property {number} oidx
 * @property {number} value
 * @property {string} script
 */

/**
 * @callback OperationalTx~AbstractCoinToRawCoin
 * @return {OperationalTx~AbstractRawCoin}
 */

/**
 * @typedef {Object} OperationalTx~AbstractCoin
 * @property {OperationalTx~AbstractCoinToRawCoin} toRawCoin
 */

/**
 * @typedef OperationalTx~selectCoinsResult
 * @property {OperationalTx~AbstractCoin[]} coins
 * @property {ColorValue} total
 */

/**
 * Return of object that have
 *  coins -- an array of utxo objects with same color that given color value
 *  total -- sum of coins that at least equal of given color value
 * For uncolored coins sum of values of UTXO objects must also include
 *  a fee (usually it is ComposedTx)
 *
 * @abstract
 * @param {ColorValue} cvalue
 * @param {FeeEstimator} [feeEstimator]
 * @return {Promise.<OperationalTx~selectCoinsResult>}
 */
OperationalTx.prototype.selectCoins = function () {
  return Promise.reject(
    new NotImplemented(this.constructor.name + '.selectCoins'))
}

/**
 * Returns an address which can be used as a change for given color definition
 *
 * @abstract
 * @param {IColorDefinition} cdef
 * @return {Promise.<string>}
 */
OperationalTx.prototype.getChangeAddress = function () {
  return Promise.reject(
    new NotImplemented(this.constructor.name + '.getChangeAddress'))
}

/**
 * Returns ColorValue representing the fee for a certain tx size
 *
 * @param {number} txSize Transaction size in bytes
 * @param {number} [feePerKb=10000] Satoshis-per-kilobyte
 * @return {ColorValue}
 */
OperationalTx.prototype.getRequiredFee = function (txSize, feePerKb) {
  // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/main.cpp#L53
  if (feePerKb === undefined) {
    feePerKb = 10000
  }

  var uncolored = new Uncolored()
  var feeValue = Math.ceil(txSize * feePerKb / 1000)

  return new ColorValue(uncolored, feeValue)
}

/**
 * Returns ColorValue representing smallest satoshi value
 *  which isn't dust according to current parameters
 *
 * @return {ColorValue}
 */
OperationalTx.prototype.getDustThreshold = function () {
  // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/core.h#L151-L162
  var uncolored = new Uncolored()
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
