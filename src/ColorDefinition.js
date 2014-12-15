var _ = require('lodash')

var errors = require('./errors')
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

ColorDefinition._colorDefinitionClasses = {}

/**
 * @param {string} type
 * @param {function} cls
 * @throws {ColorDefinitionAlreadyRegisteredError}
 */
ColorDefinition.registerColorDefinition = function (type, cls) {
  verify.string(type)
  verify.function(cls)

  if (!_.isUndefined(ColorDefinition._colorDefinitionClasses[type])) {
    throw new errors.ColorDefinitionAlreadyRegisteredError(type + ': ' + cls.name)
  }

  ColorDefinition._colorDefinitionClasses[type] = cls
}

/**
 * @param {string} type
 * @return {?function}
 */
ColorDefinition.getColorDefenitionClsForType = function (type) {
  verify.string(type)

  return ColorDefinition._colorDefinitionClasses[type] || null
}

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
  throw new errors.NotImplementedError('ColorDefinition.getColorType')
}

/**
 * @abstract
 * @return {string}
 */
ColorDefinition.prototype.getDesc = function () {
  throw new errors.NotImplementedError('ColorDefinition.getDesc')
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
  throw new errors.NotImplementedError('ColorDefinition.fromDesc')
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
  throw new errors.NotImplementedError('ColorDefinition.makeComposedTx')
}


module.exports = ColorDefinition
