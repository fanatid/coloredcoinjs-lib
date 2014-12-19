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
ColorDefinition.fromDesc = function () {
  throw new errors.NotImplementedError('ColorDefinition.fromDesc')
}

/**
 * @callback ColorDefinition~transformToComposedTxCallback
 * @param {?Error} error
 * @param {ComposedTx} composedTx
 */

/**
 * @abstract
 * @param {OperationalTx} operationalTx
 * @param {ColorDefinition~transformToComposedTxCallback} cb
 */
ColorDefinition.makeComposedTx = function () {
  throw new errors.NotImplementedError('ColorDefinition.makeComposedTx')
}

/**
 * @abstract
 * @param {OperationalTx} operationalTx
 * @param {ColorDefinition~transformToComposedTxCallback} cb
 */
ColorDefinition.composeGenesisTx = function () {
  throw new errors.NotImplementedError('ColorDefinition.composeGenesisTx')
}


module.exports = ColorDefinition
