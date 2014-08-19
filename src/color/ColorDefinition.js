/**
 * Represents a color definition scheme. This means how color exists and
 *  is transferred in the blockchain
 *
 * @class ColorDefinition
 *
 * @param {number} colorId
 */
function ColorDefinition(colorId) {
  this.colorId = colorId
}

/**
 * Return colorId
 *
 * @return {number}
 */
ColorDefinition.prototype.getColorId = function() {
  return this.colorId
}

/**
 * Return ColorDefinition type
 * @abstract
 * @return {string}
 */
ColorDefinition.prototype.getColorType = function() {
  throw new Error('ColorDefinition.getColorType not implemented')
}

/**
 * Return scheme of current ColorDefinition
 * @abstract
 * @return {string}
 */
ColorDefinition.prototype.getScheme = function() {
  throw new Error('ColorDefinition.getScheme not implemented')
}

/**
 * Create new ColorDefinition from scheme or throw error
 * @abstract
 * @param {number} colorId
 * @param {string} scheme
 * @return {ColorDefinition}
 */
ColorDefinition.fromScheme = function() {
  throw new Error('ColorDefinition.fromScheme not implemented')
}

/**
 * @callback ColorDefinition~makeComposedTx
 * @param {?Error} error
 * @param {ComposedTx} composedTx
 */

/**
 * Create ComposedTx from OperationalTx
 * @abstract
 * @param {OperationalTx} operationalTx
 * @param {ColorDefinition~makeComposedTx} cb
 */
ColorDefinition.makeComposedTx = function() {
  throw new Error('ColorDefinition.makeComposedTx not implemented')
}


module.exports = ColorDefinition
