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

/** @todo Add runKernel, getAffectingInputs */

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
  throw new errors.NotImplementedError('ColorDefinition.desc')
}

/**
 * @abstract
 * @static
 * @param {number} colorId
 * @param {string} desc
 * @return {IColorDefinition}
 */
IColorDefinition.fromDesc = function () {
  throw new errors.NotImplementedError('ColorDefinition.fromDesc')
}

/**
 * @abstract
 * @static
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
IColorDefinition.makeComposedTx = function () {
  throw new errors.NotImplementedError('ColorDefinition.makeComposedTx')
}

/**
 * @abstract
 * @static
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
IColorDefinition.composeGenesisTx = function () {
  throw new errors.NotImplementedError('ColorDefinition.composeGenesisTx')
}

module.exports = IColorDefinition
