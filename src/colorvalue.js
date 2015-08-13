import errors from './errors'

/**
 * @class ColorValue
 */
export default class ColorValue {
  /**
   * @constructor
   * @param {IColorDefinition} cdef
   * @param {number} value
   */
  constructor (cdef, value) {
    this._cdef = cdef
    this._value = value
  }

  /**
   * @return {IColorDefinition}
   */
  getColorDefinition () {
    return this._cdef
  }

  /**
   * @return {number}
   */
  getColorId () {
    return this._cdef.getColorId()
  }

  /**
   * @return {number}
   */
  getValue () {
    return this._value
  }

  /**
   * @return {boolean}
   */
  isUncolored () {
    return this._cdef.getColorCode() === 'uncolored'
  }

  /**
   * @return {ColorValue}
   */
  clone () {
    return new ColorValue(this._cdef, this._value)
  }

  /**
   * @param {ColorValue} other
   * @throws {IncompatibilityError} If ColorValues are incompatible
   */
  checkCompatibility (other) {
    let isCompatibility = (
      other instanceof ColorValue &&
      this._cdef.getColorId() === other.getColorId())

    if (!isCompatibility) {
      throw new errors.ColorValue.IncompatibilityError(`${this}, ${other}`)
    }
  }

  /**
   * @param {ColorValue} other
   * @return {ColorValue}
   * @throws {IncompatibilityError} If ColorValues are incompatible
   */
  plus (other) {
    this.checkCompatibility(other)
    return new ColorValue(this._cdef, this._value + other.getValue())
  }

  /**
   * @return {ColorValue}
   */
  neg () {
    return new ColorValue(this._cdef, -this._value)
  }

  /**
   * @param {ColorValue} other
   * @return {ColorValue}
   * @throws {IncompatibilityError} If ColorValues are incompatible
   */
  minus (other) {
    this.checkCompatibility(other)
    return new ColorValue(this._cdef, this._value - other.getValue())
  }

  /**
   * @param {ColorValue[]} colorValues
   * @return {ColorValue}
   * @throws {InvalidValuesLength|IncompatibilityError}
   */
  static sum (colorValues) {
    if (colorValues.length === 0) {
      throw new errors.ColorValue.InvalidValuesLength()
    }

    return colorValues.reduce((a, b) => { return a.plus(b) })
  }
}
