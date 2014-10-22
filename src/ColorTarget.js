var verify = require('./verify')


/**
 * @class ColorTarget
 *
 * @param {string} script
 * @param {ColorValue} colorValue
 */
function ColorTarget(script, colorValue) {
  verify.hexString(script)
  verify.ColorValue(colorValue)

  this.script = script
  this.colorValue = colorValue
}

/**
 * @return {Buffer}
 */
ColorTarget.prototype.getScript = function() {
  return this.script
}

/**
 * @return {ColorValue}
 */
ColorTarget.prototype.getColorValue = function() {
  return this.colorValue
}

/**
 * @return {number}
 */
ColorTarget.prototype.getValue = function() {
  return this.getColorValue().getValue()
}

/**
 * @return {ColorDefinition}
 */
ColorTarget.prototype.getColorDefinition = function() {
  return this.getColorValue().getColorDefinition()
}

/**
 * @return {number}
 */
ColorTarget.prototype.getColorId = function() {
  return this.getColorValue().getColorId()
}

/**
 * @return {boolean}
 */
ColorTarget.prototype.isUncolored = function() {
  return this.getColorValue().isUncolored()
}

/**
 * @typedef {Object} AbstractColorTarget
 * @property {function} getColorValue
 */

/**
 * Calculate total sum of targets
 *
 * @param {AbstractColorTarget[]}
 * @throws {Error} Will throw an error if colorValues of targets not incompatible
 * @return {number}
 */
ColorTarget.sum = function(targets) {
  var colorValues = targets.map(function(target) { return target.getColorValue() })
  return colorValues[0].constructor.sum(colorValues)
}


module.exports = ColorTarget
