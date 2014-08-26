var assert = require('assert')

var _ = require('lodash')

var ColorValue = require('./ColorValue')


/**
 * @class ColorTarget
 *
 * @param {string} address
 * @param {ColorValue} colorValue
 */
function ColorTarget(address, colorValue) {
  assert(_.isString(address), 'Expected string address, got ' + address)
  assert(colorValue instanceof ColorValue, 'Expected colorValue isntance of ColorValue, got ' + colorValue)

  this.address = address
  this.colorValue = colorValue
}

/**
 * @return {string}
 */
ColorTarget.prototype.getAddress = function() {
  return this.address
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
