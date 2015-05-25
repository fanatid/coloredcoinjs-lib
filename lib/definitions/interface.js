/* globals Promise:true */
var Promise = require('bluebird')

var errors = require('../errors')

/**
 * Represents a color definition desc. This means how color exists and
 *  is transferred in the blockchain
 *
 * @class IColorDefinition
 * @param {number} colorId
 */
function IColorDefinition (colorId) {
  this._colorId = colorId
}

/**
 * @abstract
 * @return {string}
 */
IColorDefinition.getColorCode = function () {
  throw new errors.NotImplementedError('IColorDefinition.getColorCode')
}

/**
 * @abstract
 * @return {string}
 */
IColorDefinition.prototype.getColorCode = function () {
  return this.constructor.getColorCode()
}

/**
 * @return {number}
 */
IColorDefinition.prototype.getColorId = function () {
  return this._colorId
}

/**
 * @abstract
 * @return {string}
 */
IColorDefinition.prototype.getDesc = function () {
  throw new errors.NotImplementedError('IColorDefinition.desc')
}

/**
 * @abstract
 * @static
 * @param {number} colorId
 * @param {string} desc
 * @return {IColorDefinition}
 */
IColorDefinition.fromDesc = function () {
  throw new errors.NotImplementedError('IColorDefinition.fromDesc')
}

/**
 * @abstract
 * @param {bitcore.Transaction} tx
 * @param {Array.<?ColorValue>} inColorValues
 * @param {getTxFn} getTxFn
 * @return {Promise<Array.<?ColorValue>>}
 */
IColorDefinition.prototype.runKernel = function () {
  return Promise.reject(
    new errors.NotImplementedError('IColorDefinition.runKernel'))
}

/**
 * @abstract
 * @param {bitcore.Transaction} tx
 * @param {number[]} vouts
 * @param {getTxFn} getTxFn
 * @return {Promise.<number[]>}
 */
IColorDefinition.getAffectingInputs = function () {
  return Promise.reject(
    new errors.NotImplementedError('IColorDefinition.getAffectingInputs'))
}

/**
 * @abstract
 * @static
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
IColorDefinition.makeComposedTx = function () {
  return Promise.reject(
    new errors.NotImplementedError('IColorDefinition.makeComposedTx'))
}

/**
 * @abstract
 * @static
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
IColorDefinition.composeGenesisTx = function () {
  return Promise.reject(
    new errors.NotImplementedError('IColorDefinition.composeGenesisTx'))
}

module.exports = IColorDefinition
