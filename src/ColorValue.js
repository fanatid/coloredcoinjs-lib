var assert = require('assert')

var _ = require('lodash')

var colordef
function getColordef() {
  if (_.isUndefined(colordef))
    colordef = require('./colordef')

  return colordef
}


/**
 * @class ColorValue
 *
 * @param data
 * @param {colordef.ColorDefinition} data.colordef 
 * @param {number} data.value
 */
function ColorValue(data) {
  assert(_.isObject(data), 'Expected object data, got ' + data)
  assert(data.colordef instanceof getColordef().ColorDefinition,
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
 * Check compatibility with other ColorValue
 *
 * @param {ColorValue} other
 * @return {boolean}
 */
ColorValue.prototype.checkCompatibility = function(other) {
  var isCompatibility = (
    other instanceof ColorValue &&
    this.getColorId() === other.getColorId())

  return isCompatibility
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
 * Add other.value to this.value if other compatibility with this
 *
 * @param {ColorValue}
 * @return {ColorValue}
 */
ColorValue.prototype.add = function(other) {
  var isCompatibility = this.checkCompatibility(other)

  if (isCompatibility)
    this.value += other.getValue()
}


module.exports = ColorValue
