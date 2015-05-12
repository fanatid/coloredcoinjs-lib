var errors = require('./errors')

/**
 * @class ColorValue
 *
 * @param {ColorDefinition} colordef
 * @param {number} value
 */
function ColorValue (colordef, value) {
  this.colordef = colordef
  this.value = value
}

/**
 * @return {ColorDefinition}
 */
ColorValue.prototype.getColorDefinition = function () {
  return this.colordef
}

/**
 * @return {number}
 */
ColorValue.prototype.getColorId = function () {
  return this.colordef.getColorId()
}

/**
 * @return {boolean}
 */
ColorValue.prototype.isUncolored = function () {
  return this.getColorDefinition().getColorType() === 'uncolored'
}

/**
 * @return {number}
 */
ColorValue.prototype.getValue = function () {
  return this.value
}

/**
 * @return {ColorValue}
 */
ColorValue.prototype.clone = function () {
  return new ColorValue(this.getColorDefinition(), this.getValue())
}

/**
 * Check compatibility with other ColorValue
 *
 * @param {ColorValue} other
 * @throws {IncompatibilityColorValuesError} If ColorValues are incompatible
 */
ColorValue.prototype.checkCompatibility = function (other) {
  var isCompatibility = (
    other instanceof ColorValue &&
    this.getColorId() === other.getColorId())

  if (!isCompatibility) {
    throw new errors.IncompatibilityColorValuesError(this + ', ' + other)
  }
}

/**
 * Create new ColorValue with value as sum of current and other
 *
 * @param {ColorValue} other
 * @return {ColorValue}
 * @throws {IncompatibilityColorValuesError} If ColorValues are incompatible
 */
ColorValue.prototype.plus = function (other) {
  this.checkCompatibility(other)

  return new ColorValue(this.getColorDefinition(), this.getValue() + other.getValue())
}

/**
 * Create new ColorValue with negative value
 *
 * @return {ColorValue}
 */
ColorValue.prototype.neg = function () {
  return new ColorValue(this.getColorDefinition(), -this.getValue())
}

/**
 * Create new ColorValue with value as difference of current and other
 *
 * @param {ColorValue} other
 * @return {ColorValue}
 * @throws {IncompatibilityColorValuesError} If ColorValues are incompatible
 */
ColorValue.prototype.minus = function (other) {
  return this.plus(other.neg())
}

/**
 * Sum values of colorValues
 *
 * @param {ColorValue[]} colorValues
 * @throws {IncompatibilityColorValuesError}
 */
ColorValue.sum = function (colorValues) {
  if (colorValues.length === 0) {
    throw new RangeError('ColorValues.length must be greater than zero')
  }

  return colorValues.reduce(function (a, b) { return a.plus(b) })
}

/**
 * @return {string}
 */
ColorValue.prototype.toString = function () {
  return 'ColorValue(colorId: ' + this.getColorId() + ', value: ' + this.getValue() + ')'
}

module.exports = ColorValue
