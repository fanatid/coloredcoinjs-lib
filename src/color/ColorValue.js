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
 * @return {boolean}
 */
ColorValue.prototype.checkCompatibility = function(other) {
  var isCompatibility = (
    other instanceof ColorValue &&
    this.getColorId() === other.getColorId())

  return isCompatibility
}

/**
 * @callback ColorValue~addCallback
 * @param {Error|null} error
 * @param {ColorValue} result
 */

/**
 * Add value from other ColorValue from current ColorValue and return new ColorValue
 *
 * @param {ColorValue} other
 * @param {ColorValue~addCallback} cb
 */
ColorValue.prototype.add = function(other, cb) {
  var self = this

  function error() { cb(new TypeError('Incompatible ColorValues')) }

  function success() {
    cb(null, new ColorValue({
      colordef: self.getColorDefinition(),
      value: self.getValue() + other.getValue()
    }))
  }

  var isCompatibility = self.checkCompatibility(other)
  process.nextTick(isCompatibility ? success : error)
}

/**
 * Create new ColorValue with negative value
 *
 * @return {ColorValue}
 */
ColorValue.prototype.neg = function() {
  return new ColorValue({
    colordef: this.getColorDefinition(),
    value: -this.getValue()
  })
}

/**
 * @callback ColorValue~subCallback
 * @param {Error|null} error
 * @param {ColorValue} result
 */

/**
 * Sub value from other ColorValue from current ColorValue and return new ColorValue
 *
 * @param {ColorValue} other
 * @param {ColorValue~subCallback} cb
 */
ColorValue.prototype.sub = function(other, cb) {
  var self = this

  function error() { cb(new TypeError('Incompatible ColorValues')) }

  function success() {
    cb(null, new ColorValue({
      colordef: self.getColorDefinition(),
      value: self.getValue() - other.getValue()
    }))
  }

  var isCompatibility = self.checkCompatibility(other)
  process.nextTick(isCompatibility ? success : error)
}

/**
 * @callback ColorValue~sumCallback
 * @param {Error|null} error
 * @param {ColorValue} result
 */

/**
 * Sum values of colorValues
 *
 * @param {Array} colorValues
 * @param {ColorValue~sumCallback} cb
 */
ColorValue.sum = function(colorValues, cb) {
  assert(_.isArray(colorValues), 'Expected Array colorValues, got ' + colorValues)
  assert(colorValues.length > 0, 'Expected Array of ColorValues, got ' + colorValues)
  colorValues.forEach(function(colorValue) {
    assert(colorValue instanceof ColorValue, 'Expected Array of ColorValues, got ' + colorValues)
  })
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  function error() { cb(new TypeError('Incompatible ColorValues')) }

  function success() {
    var totalColorValue = colorValues.reduce(function(cv1, cv2) {
      return new ColorValue({
        colordef: cv1.getColorDefinition(),
        value: cv1.getValue() + cv2.getValue()
      })
    })
    cb(null, totalColorValue)
  }

  var isCompatibility = colorValues.every(function(colorValue) {
    return colorValues[0].checkCompatibility(colorValue)
  })
  process.nextTick(isCompatibility ? success : error)
}


module.exports = ColorValue
