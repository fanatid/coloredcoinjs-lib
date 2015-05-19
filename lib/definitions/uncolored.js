/* globals Promise:true */
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
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
UncoloredColorDefinition.makeComposedTx = function (operationalTx) {
  var composedTx
  var targets
  var targetsTotalValue

  return Promise.try(function () {
    targets = operationalTx.getTargets()
    targetsTotalValue = ColorTarget.sum(targets)

    composedTx = operationalTx.makeComposedTx()
    composedTx.addTxOuts(targets.map(function (target) {
      return {target: target}
    }))

    return Promise.fromNode(operationalTx.selectCoins.bind(
      operationalTx, targetsTotalValue, composedTx))
  })
  .spread(function (coins, coinsValue) {
    composedTx.addTxIns(coins.map(function (coin) {
      return coin.toRawCoin()
    }))

    var fee = composedTx.estimateRequiredFee()
    var change = coinsValue.minus(targetsTotalValue).minus(fee)

    if (change.getValue() > operationalTx.getDustThreshold().getValue()) {
      var uncolored = new UncoloredColorDefinition()
      var changeAddress = operationalTx.getChangeAddress(uncolored)
      var rawScript = bitcore.Script.fromAddress(changeAddress).toHex()

      composedTx.addTxOut({script: rawScript, value: change.getValue()})
    }

    return composedTx
  })
}

/**
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
UncoloredColorDefinition.composeGenesisTx = function () {
  throw new errors.NotImplementedError(
    'UncoloredColorDefinition.composeGenesisTx')
}

module.exports = UncoloredColorDefinition
