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
 * @callback ColorTarget~sumCallback
 * @param {Error|null} error
 * @param {ColorValue} result
 */

/**
 * Calculate total sum of targets
 *
 * @param {Array} targets Array of ColorTargets or class instances that have method getColorValue()
 * @param {ColorTarget~sumCallback} cb
 */
ColorTarget.sum = function(targets, cb) {
  assert(_.isArray(targets), 'Expected Array targets, got ' + targets)

  var colorValues = targets.map(function(target) { return target.getColorValue() })
  targets[0].constructor.sum(colorValues, cb)
}


module.exports = ColorTarget
