var errors = require('./errors')

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

/*
JSUtil.defineGetter(ColorTarget.prototype, 'script', function () {
  return this._script
})

JSUtil.defineGetter(ColorTarget.prototype, 'colorValue', function () {
  / * @todo .clone * /
  return this._colorValue
})
*/

/**
 * @return {ColorValue}
 */
ColorTarget.prototype.getColorValue = function () {
  return this.colorValue
}

/**
 * @return {number}
 */
ColorTarget.prototype.getValue = function () {
  return this.getColorValue().getValue()
}

/**
 * @return {ColorDefinition}
 */
ColorTarget.prototype.getColorDefinition = function () {
  return this.getColorValue().getColorDefinition()
}

/**
 * @return {number}
 */
ColorTarget.prototype.getColorId = function () {
  return this.getColorValue().getColorId()
}

/**
 * @return {boolean}
 */
ColorTarget.prototype.isUncolored = function () {
  return this.getColorValue().isUncolored()
}

/**
 * Calculate total sum of targets
 *
 * @param {Array.<ColorTarget>} targets
 * @return {ColorValue}
 * @throws {IncompatibilityColorValuesError} If ColorValues of ColorTargets are incompatible
 */
ColorTarget.sum = function (targets) {
  var colorValues = targets.map(function (target) {
    return target.getColorValue()
  })

  return colorValues[0].constructor.sum(colorValues)
}

/**
 * @typedef {Object} groupTargetsByColorResult
 * @property {ColorTarget[]} colorId1
 * @property {ColorTarget[]} colorIdN
 */

/**
 * Group targets by ColorId or return error if target is not uncolored
 *  or not instance of targetCls
 *
 * @param {ColorTarget[]} targets
 * @param {function} targetCls ColorDefinition constructor for filter targets
 * @return {groupTargetsByColorResult}
 * @throws {IncompatibilityColorDefinitionsError} If ColorDefinition not Uncolored and not targetCls
 */
ColorTarget.groupTargetsByColor = function (targets, targetCls) {
  var UncoloredColorDefinition = require('./definitions/uncolored')

  var targetsByColor = {}
  targets.forEach(function (target) {
    var colorDefinition = target.getColorDefinition()

    var isUncoloredCls = colorDefinition instanceof UncoloredColorDefinition
    var isTargetCls = colorDefinition instanceof targetCls

    if (!isUncoloredCls && !isTargetCls) {
      throw new errors.IncompatibilityColorDefinitionsError()
    }

    var colorId = target.getColorId()

    if (targetsByColor[colorId] === undefined) {
      targetsByColor[colorId] = []
    }
    targetsByColor[colorId].push(target)
  })

  return targetsByColor
}

module.exports = ColorTarget
