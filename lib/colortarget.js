'use strict'

var _ = require('lodash')

var errors = require('./errors')
var ColorValue = require('./colorvalue')

/**
 * @class ColorTarget
 *
 * @param {string} script
 * @param {ColorValue} cvalue
 */
function ColorTarget (script, cvalue) {
  this._script = script
  this._cvalue = cvalue
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
  return this._cvalue
}

/**
 * @return {number}
 */
ColorTarget.prototype.getValue = function () {
  return this._cvalue.getValue()
}

/**
 * @return {IColorDefinition}
 */
ColorTarget.prototype.getColorDefinition = function () {
  return this._cvalue.getColorDefinition()
}

/**
 * @return {number}
 */
ColorTarget.prototype.getColorId = function () {
  return this._cvalue.getColorId()
}

/**
 * @return {boolean}
 */
ColorTarget.prototype.isUncolored = function () {
  return this._cvalue.isUncolored()
}

/**
 * @param {Array.<ColorTarget>} targets
 * @return {ColorValue}
 * @throws {IncompatibilityError}
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
 * @throws {IncompatibilityError}
 */
ColorTarget.groupByColorId = function (targets, TargetCls) {
  return _.groupBy(targets, function (target) {
    var isTargetCls = target.getColorDefinition() instanceof TargetCls
    if (!target.isUncolored() && !isTargetCls) {
      throw new errors.ColorDefinition.IncompatibilityError()
    }

    return target.getColorId()
  })
}

module.exports = ColorTarget
