var assert = require('assert')

var _ = require('lodash')

var UncoloredColorDefinition = require('./UncoloredColorDefinition')


/**
 * @typedef {Object} AbstractTarget
 * @property {function} getColorDefinition Return ColorDefiniton for target
 * @property {function} getColorId Return colorId of ColorDefiniton for target
 */

/**
 * @typedef {Object} GroupedTargets
 * @property {AbstractTarget[]} colorId1
 * @property {AbstractTarget[]} colorId2
 * @property {AbstractTarget[]} colorIdN
 */

/**
 * Group targets by ColorId or return error if target is not uncolored
 *  or not instance of targetCls
 *
 * @param {AbstractTarget[]} targets
 * @param {function} targetCls ColorDefinition constructor for filter targets
 * @return {GroupedTargets}
 * @throws {Error} If ColorDefinition not Uncolored and not targetCls
 */
function groupTargetsByColor(targets, targetCls) {
  assert(_.isArray(targets), 'Expected Array targets, got ' + targets)
  assert(_.isFunction(targetCls), 'Expected function targetCls, got ' + targetCls)

  var targetsByColor = {}
  targets.forEach(function(target) {
    var colorDefinition = target.getColorDefinition()

    var isUncoloredCls = colorDefinition instanceof UncoloredColorDefinition
    var isTargetCls = colorDefinition instanceof targetCls

    if (isUncoloredCls || isTargetCls) {
      var colorId = target.getColorId()

      if (_.isUndefined(targetsByColor[colorId]))
        targetsByColor[colorId] = []

      targetsByColor[colorId].push(target)

      return
    }

    throw new Error('Incompatible color definition')
  })

  return targetsByColor
}


module.exports = {
  groupTargetsByColor: groupTargetsByColor
}
