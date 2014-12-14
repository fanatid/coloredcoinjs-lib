var NotImplementedError = require('./errors').NotImplementedError
var verify = require('./verify')


/**
 * Represents a color definition desc. This means how color exists and
 *  is transferred in the blockchain
 *
 * @class ColorDefinition
 * @param {number} colorId
 */
function ColorDefinition(colorId) {
  verify.number(colorId)

  this.colorId = colorId
}

// @todo
// Add register function

/**
 * @return {number}
 */
ColorDefinition.prototype.getColorId = function () {
  return this.colorId
}

/**
 * @abstract
 * @return {string}
 */
ColorDefinition.prototype.getColorType = function () {
  throw new NotImplementedError('ColorDefinition.getColorType')
}

/**
 * @abstract
 * @return {string}
 */
ColorDefinition.prototype.getDesc = function () {
  throw new NotImplementedError('ColorDefinition.getDesc')
}

/**
 * Create new ColorDefinition from desc or throw error
 *
 * @abstract
 * @param {number} colorId
 * @param {string} desc
 * @return {ColorDefinition}
 */
ColorDefinition.prototype.fromDesc = function () {
  throw new NotImplementedError('ColorDefinition.fromDesc')
}

/**
 * @callback ColorDefinition~makeComposedTx
 * @param {?Error} error
 * @param {ComposedTx} composedTx
 */

/**
 * Create ComposedTx from OperationalTx
 *
 * @abstract
 * @param {OperationalTx} operationalTx
 * @param {ColorDefinition~makeComposedTx} cb
 */
ColorDefinition.prototype.makeComposedTx = function () {
  throw new NotImplementedError('ColorDefinition.makeComposedTx')
}


module.exports = ColorDefinition
