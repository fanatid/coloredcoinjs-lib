var assert = require('assert')

var _ = require('lodash')

var UncoloredColorDefinition = require('./UncoloredColorDefinition')


/**
 * @callback groupTragetsByColorCallback
 * @param {Error|null} error
 * @param {Object} targetsByColor Object represent dict { colorId1: [target1, target2], colorId2: [target3] } 
 */

/**
 * Group targets by ColorId or return error if target is not uncolored
 *  or not instance of targetCls
 *
 * @param {Array} targets Array of targets that have method getColorDefinition()
 * @param {function} targetCls ColorDefinition constructor for filter targets
 * @param {groupTragetsByColorCallback} cb
 */
function groupTargetsByColor(targets, targetCls, cb) {
  assert(_.isArray(targets), 'Expected Array targets, got ' + targets)
  assert(_.isFunction(targetCls), 'Expected function targetCls, got ' + targetCls)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var isExpected = targets.every(function(target) {
    var colorDefinition = target.getColorDefinition()

    var isUncoloredCls = colorDefinition instanceof UncoloredColorDefinition
    var isTargetCls = colorDefinition instanceof targetCls

    return isUncoloredCls || isTargetCls
  })
  if (!isExpected) {
    process.nextTick(function() { cb(new Error('Incompatible color definition')) })
    return
  }

  var targetsByColor = {}
  targets.forEach(function(target) {
    var colorId = target.getColorId()

    if (_.isUndefined(targetsByColor[colorId]))
      targetsByColor[colorId] = [target]
    else
      targetsByColor[colorId].push(target)
  })

  process.nextTick(function() { cb(null, targetsByColor) })
}


module.exports = {
  groupTargetsByColor: groupTargetsByColor
}
