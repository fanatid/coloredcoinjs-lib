'use strict'

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

inherits(UncoloredColorDefinition, IColorDefinition)
_.extend(UncoloredColorDefinition, IColorDefinition)

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
 * @param {string} desc
 * @param {(number|ColorDefinitionManager)} resolver
 * @return {Promise.<UncoloredColorDefinition>}
 */
UncoloredColorDefinition.fromDesc = function (desc, resolver) {
  return Promise.try(function () {
    if (desc !== '') {
      throw new errors.ColorDefinition.IncorrectDesc('Uncolored', desc)
    }

    if (_.isNumber(resolver) && resolver !== UncoloredColorId) {
      throw new errors.ColorDefinition.IncorrectColorId('Uncolored', resolver)
    }

    return new UncoloredColorDefinition()
  })
}

/**
 * @param {OperationalTx} optx
 * @return {Promise.<ComposedTx>}
 */
UncoloredColorDefinition.makeComposedTx = function (optx) {
  return Promise.try(function () {
    var targets = optx.getTargets()
    var targetsTotalValue = ColorTarget.sum(targets)

    var comptx = optx.makeComposedTx()
    comptx.addOutputs(targets.map(function (target) {
      return {target: target}
    }))

    return optx.selectCoins(targetsTotalValue, comptx)
      .then(function (result) {
        comptx.addInputs(_.invoke(result.coins, 'toRawCoin'))

        var fee = comptx.estimateRequiredFee()
        var change = result.total.minus(targetsTotalValue).minus(fee)

        if (change.getValue() <= optx.getDustThreshold().getValue()) {
          return comptx
        }

        return optx.getChangeAddress(new UncoloredColorDefinition())
          .then(function (changeAddress) {
            comptx.addOutput({
              script: bitcore.Script.fromAddress(changeAddress).toHex(),
              value: change.getValue()
            })
            return comptx
          })
      })
  })
}

module.exports = UncoloredColorDefinition
