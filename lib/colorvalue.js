var errors = require('./errors')

/**
 * @class ColorValue
 *
 * @param {ColorDefinition} cdef
 * @param {number} value
 */
function ColorValue (cdef, value) {
  this._cdef = cdef
  this._value = value
}

/*
JSUtil.defineGetter(ColorValue.prototype, 'colorDefinition', function () {
  / * IColorDefinition is immutable object, new instance not needed * /
  return this._cdef
})

JSUtil.defineGetter(ColorValue.prototype, 'colorId', function () {
  return this._cdef.colorId
})

JSUtil.defineGetter(ColorValue.prototype, 'value', function () {
  return this._value
})
*/

/**
 * @return {boolean}
 */
ColorValue.prototype.isUncolored = function () {
  return this._cdef.code === 'uncolored'
}

/**
 * @return {ColorValue}
 */
ColorValue.prototype.clone = function () {
  return new ColorValue(this._cdef, this._value)
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
    this._cdef.colorId === other.colorId)

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
ColorValue.prototype.inspect = function () {
  return 'ColorValue(colorId: ' + this.getColorId() + ', value: ' + this.getValue() + ')'
}

module.exports = ColorValue
