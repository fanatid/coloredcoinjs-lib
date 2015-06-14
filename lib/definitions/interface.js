'use strict'

var Promise = require('bluebird')

var errors = require('../errors')

/**
 * Represents a color definition.
 * This means how color exists and is transferred in the blockchain.
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
  throw new errors.NotImplemented('IColorDefinition.getColorCode')
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
  throw new errors.NotImplemented(this.constructor.name + '.desc')
}

/**
 * @abstract
 * @static
 * @param {string} desc
 * @param {(number|ColorDefinitionManager)} resolver
 * @param {Object} [opts]
 * @param {boolean} [opts.autoAdd=true]
 * @return {Promise.<IColorDefinition>}
 */
IColorDefinition.fromDesc = function () {
  return Promise.reject(
    new errors.NotImplemented('IColorDefinition.fromDesc'))
}

/**
 * @abstract
 * @static
 * @param {bitcore.Transaction} tx
 * @param {(number|ColorDefinitionManager)} resolver
 * @param {Object} [opts]
 * @param {boolean} [opts.autoAdd=true]
 * @return {Promise.<?IColorDefinition>}
 */
IColorDefinition.fromTx = function () {
  return Promise.reject(
    new errors.NotImplemented('IColorDefinition.fromTx'))
}

/**
 * @param {bitcore.Transaction} tx
 * @return {boolean}
 */
IColorDefinition.prototype.isGenesis = function () {
  throw new errors.NotImplemented(this.constructor.name + '.isGenesis')
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
    new errors.NotImplemented(this.constructor.name + '.runKernel'))
}

/**
 * @abstract
 * @param {bitcore.Transaction} tx
 * @param {number[]} oidxs
 * @param {getTxFn} getTxFn
 * @return {Promise.<number[]>}
 */
IColorDefinition.getAffectingInputs = function () {
  return Promise.reject(
    new errors.NotImplemented('IColorDefinition.getAffectingInputs'))
}

/**
 * @abstract
 * @static
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
IColorDefinition.makeComposedTx = function () {
  return Promise.reject(
    new errors.NotImplemented('IColorDefinition.makeComposedTx'))
}

/**
 * @abstract
 * @static
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
IColorDefinition.composeGenesisTx = function () {
  return Promise.reject(
    new errors.NotImplemented('IColorDefinition.composeGenesisTx'))
}

module.exports = IColorDefinition
