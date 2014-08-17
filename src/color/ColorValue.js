var assert = require('assert')

var _ = require('lodash')

var ColorDefinition = require('./ColorDefinition')
var UncoloredColorDefinition = require('./UncoloredColorDefinition')


/**
 * @class ColorValue
 *
 * @param data
 * @param {ColorDefinition} data.colordef 
 * @param {number} data.value
 */
function ColorValue(data) {
  assert(_.isObject(data), 'Expected object data, got ' + data)
  assert(data.colordef instanceof ColorDefinition,
    'Expected ColorDefinition data.colordef, got ' + data.colordef)
  assert(_.isNumber(data.value), 'Expected number data.value, got ' + data.value)

  this.colordef = data.colordef
  this.value = data.value
}

/**
 * @return {colordef.ColorDefinition}
 */
ColorValue.prototype.getColorDefinition = function() {
  return this.colordef
}

/**
 * @return {number}
 */
ColorValue.prototype.getColorId = function() {
  return this.colordef.getColorId()
}

/**
 * @return {boolean}
 */
ColorValue.prototype.isUncolored = function() {
  var uncoloredColorId = new UncoloredColorDefinition().getColorId()
  return this.getColorId() === uncoloredColorId
}

/**
 * Get value from ColorValue
 *
 * @return {number}
 */
ColorValue.prototype.getValue = function() {
  return this.value
}

/**
 * Create new ColorValue from current
 *
 * @return {ColorValue}
 */
ColorValue.prototype.clone = function() {
  return new ColorValue({
    colordef: this.getColorDefinition(),
    value: this.getValue()
  })
}

/**
 * Check compatibility with other ColorValue
 *
 * @param {ColorValue} other
 * @throws {TypeError} If not compatibility
 */
ColorValue.prototype.checkCompatibility = function(other) {
  var isCompatibility = (
    other instanceof ColorValue &&
    this.getColorId() === other.getColorId())

  if (!isCompatibility)
    throw new TypeError('ColorValues not compatibility')
}

/**
 * Create new ColorValue with value as sum of current and other
 *
 * @param {ColorValue} other
 * @return {ColorValue}
 * @throws {TypeError} If not compatibility
 */
ColorValue.prototype.plus = function(other) {
  this.checkCompatibility(other)

  var newColorValue = this.clone()
  newColorValue.value += other.value

  return newColorValue
}

/**
 * Create new ColorValue with negative value
 *
 * @return {ColorValue}
 */
ColorValue.prototype.neg = function() {
  var newColorValue = this.clone()
  newColorValue.value = -newColorValue.value

  return newColorValue
}

/**
 * Create new ColorValue with value as difference of current and other
 *
 * @param {ColorValue} other
 * @return {ColorValue}
 * @throws {TypeError} If not compatibility
 */
ColorValue.prototype.minus = function(other) {
  return this.plus(other.neg())
}

/**
 * Sum values of colorValues
 *
 * @param {ColorValue[]} colorValues
 * @throws {TypeError} If colorValues not incompatible
 */
ColorValue.sum = function(colorValues) {
  // Todo add RangeError
  var totalColorValue = colorValues.reduce(function(a, b) { return a.plus(b) })

  return totalColorValue
}


module.exports = ColorValue
