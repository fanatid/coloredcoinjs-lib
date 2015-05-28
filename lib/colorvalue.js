var errors = require('./errors')

/**
 * @class ColorValue
 *
 * @param {IColorDefinition} cdef
 * @param {number} value
 */
function ColorValue (cdef, value) {
  this._cdef = cdef
  this._value = value
}

/**
 * @return {IColorDefinition}
 */
ColorValue.prototype.getColorDefinition = function () {
  return this._cdef
}

/**
 * @return {number}
 */
ColorValue.prototype.getColorId = function () {
  return this._cdef.getColorId()
}

/**
 * @return {number}
 */
ColorValue.prototype.getValue = function () {
  return this._value
}

/**
 * @return {boolean}
 */
ColorValue.prototype.isUncolored = function () {
  return this._cdef.getColorCode() === 'uncolored'
}

/**
 * @return {ColorValue}
 */
ColorValue.prototype.clone = function () {
  return new ColorValue(this._cdef, this._value)
}

/**
 * @param {ColorValue} other
 * @throws {IncompatibilityError} If ColorValues are incompatible
 */
ColorValue.prototype.checkCompatibility = function (other) {
  var isCompatibility = (
    other instanceof ColorValue &&
    this._cdef.getColorId() === other.getColorId())

  if (!isCompatibility) {
    throw new errors.ColorValue.IncompatibilityError(this + ', ' + other)
  }
}

/**
 * @param {ColorValue} other
 * @return {ColorValue}
 * @throws {IncompatibilityError} If ColorValues are incompatible
 */
ColorValue.prototype.plus = function (other) {
  this.checkCompatibility(other)
  return new ColorValue(this._cdef, this._value + other.getValue())
}

/**
 * @return {ColorValue}
 */
ColorValue.prototype.neg = function () {
  return new ColorValue(this._cdef, -this._value)
}

/**
 * @param {ColorValue} other
 * @return {ColorValue}
 * @throws {IncompatibilityError} If ColorValues are incompatible
 */
ColorValue.prototype.minus = function (other) {
  this.checkCompatibility(other)
  return new ColorValue(this._cdef, this._value - other.getValue())
}

/**
 * @param {ColorValue[]} colorValues
 * @return {ColorValue}
 * @throws {IncompatibilityError}
 */
ColorValue.sum = function (colorValues) {
  if (colorValues.length === 0) {
    throw new RangeError('ColorValues.length must be greater than zero')
  }

  return colorValues.reduce(function (a, b) { return a.plus(b) })
}

module.exports = ColorValue
