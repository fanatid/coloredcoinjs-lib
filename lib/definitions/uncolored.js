/* globals Promise:true */
var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var bitcore = require('bitcore')

var IColorDefinition = require('./interface')
var ColorTarget = require('../colortarget')
var errors = require('../errors')

var UncoloredColorId = 0

/**
 * @class UncoloredColorDefinition
 * @extends IColorDefinition
 */
function UncoloredColorDefinition () {
  IColorDefinition.call(this, UncoloredColorId)
}

_.extend(UncoloredColorDefinition, IColorDefinition)
inherits(UncoloredColorDefinition, IColorDefinition)

/**
 * @return {string}
 */
UncoloredColorDefinition.getColorCode = function () {
  return 'uncolored'
}

/**
 * @return {string}
 */
UncoloredColorDefinition.prototype.getDesc = function () {
  return ''
}

/**
 * @param {number} colorId
 * @param {string} desc
 * @return {UncoloredColorDefinition}
 * @throws {(ColorDefinitionBadColorIdError|ColorDefinitionBadDescError)}
 */
UncoloredColorDefinition.fromDesc = function (colorId, desc) {
  if (colorId !== UncoloredColorId) {
    throw new errors.ColorDefinitionBadColorIdError(
      'UncoloredColorDefinition.fromDesc')
  }

  if (desc !== '') {
    throw new errors.ColorDefinitionBadDescError(
      'Uncolored fail load: ' + desc)
  }

  return new UncoloredColorDefinition()
}

/**
 * @param {OperationalTx} optx
 * @return {Promise.<ComposedTx>}
 */
UncoloredColorDefinition.makeComposedTx = function (optx) {
  return Promise.try(function () {
    var targets = optx.getTargets()
    var targetsTotalValue = ColorTarget.sum(targets)

    var composedTx = optx.makeComposedTx()
    composedTx.addOutputs(targets.map(function (target) {
      return {target: target}
    }))

    return optx.selectCoins(targetsTotalValue, composedTx)
      .then(function (result) {
        composedTx.addInputs(result.coins.map(function (coin) {
          return coin.toRawCoin()
        }))

        var fee = composedTx.estimateRequiredFee()
        var change = result.total.minus(targetsTotalValue).minus(fee)

        if (change.getValue() > optx.getDustThreshold().getValue()) {
          var uncolored = new UncoloredColorDefinition()
          var changeAddress = optx.getChangeAddress(uncolored)

          composedTx.addOutput({
            script: bitcore.Script.fromAddress(changeAddress).toHex(),
            value: change.getValue()
          })
        }

        return composedTx
      })
  })
}

module.exports = UncoloredColorDefinition
