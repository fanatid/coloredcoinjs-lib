var assert = require('assert')
var _ = require('underscore')
var inherits = require('util').inherits

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
 * @param data.colordef colordef.ColorDefinition
 */
function ColorValue(data) {
  assert(_.isObject(data), 'Expected object data, got ' + data)
  assert(data.colordef instanceof getColordef().ColorDefinition,
    'Expected ColorDefinition data.colordef, got ' + data.colordef)

  this.colordef = data.colordef
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
 * @class AdditiveColorValue
 *
 * Inherits ColorValue
 *
 * @param data
 * @param data.colordef colordef.ColorDefinition
 * @param data.value number
 */
function AdditiveColorValue(data) {
  ColorValue.call(this, data)

  assert(_.isNumber(data.value), 'Expected number data.value, got ' + data.value)

  this.value = data.value
}

inherits(AdditiveColorValue, ColorValue)

/**
 * Get value from AdditiveColorValue
 *
 * @return {number}
 */
AdditiveColorValue.prototype.getValue = function() {
  return this.value
}

/**
 * Add other.value to this.value if other compatibility with this
 *
 * @param
 * @return {AdditiveColorValue}
 */
AdditiveColorValue.prototype.add = function(other) {
  var isCompatibility = this.checkCompatibility(other)

  if (isCompatibility)
    this.value += other.getValue()
}


/**
 * @class SimpleColorValue
 *
 * Inherits AdditiveColorValue
 *
 * @param data
 * @param data.colordef colordef.ColorDefinition
 * @param data.value number
 */
function SimpleColorValue(data) {
  AdditiveColorValue.call(this, data)
}

inherits(SimpleColorValue, AdditiveColorValue)


module.exports = {
  ColorValue: ColorValue,
  AdditiveColorValue: AdditiveColorValue,
  SimpleColorValue: SimpleColorValue
}
