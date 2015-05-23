var _ = require('lodash')

var errors = require('./errors')
var ColorValue = require('./colorvalue')

/**
 * @class ColorTarget
 *
 * @param {string} script
 * @param {ColorValue} colorValue
 */
function ColorTarget (script, colorValue) {
  this._script = script
  this._colorValue = colorValue
}

/**
 * @return {string}
 */
ColorTarget.prototype.getScript = function () {
  return this._script
}

/**
 * @return {ColorValue}
 */
ColorTarget.prototype.getColorValue = function () {
  return this._colorValue
}

/**
 * @return {number}
 */
ColorTarget.prototype.getValue = function () {
  return this._colorValue.getValue()
}

/**
 * @return {ColorDefinition}
 */
ColorTarget.prototype.getColorDefinition = function () {
  return this._colorValue.getColorDefinition()
}

/**
 * @return {number}
 */
ColorTarget.prototype.getColorId = function () {
  return this._colorValue.getColorId()
}

/**
 * @return {boolean}
 */
ColorTarget.prototype.isUncolored = function () {
  return this._colorValue.isUncolored()
}

/**
 * @param {Array.<ColorTarget>} targets
 * @return {ColorValue}
 * @throws {IncompatibilityColorValuesError}
 */
ColorTarget.sum = function (targets) {
  var colorValues = targets.map(function (target) {
    return target.getColorValue()
  })

  return ColorValue.sum(colorValues)
}

/**
 * @typedef {Object} GroupedTargetsByColor
 * @property {ColorTarget[]} colorId1
 * @property {ColorTarget[]} colorIdN
 */

/**
 * Group targets by color id or throw error
 *  if target is not uncolored or not instance of TargetCls
 *
 * @param {ColorTarget[]} targets
 * @param {function} TargetCls ColorDefinition constructor for filter targets
 * @return {GroupedTargetsByColor}
 * @throws {IncompatibilityColorDefinitionsError}
 */
ColorTarget.groupByColorId = function (targets, TargetCls) {
  return _.groupBy(targets, function (target) {
    var isTargetCls = target.getColorDefinition() instanceof TargetCls
    if (!target.isUncolored() && !isTargetCls) {
      throw new errors.IncompatibilityColorDefinitionsError()
    }

    return target.getColorId()
  })
}

module.exports = ColorTarget
