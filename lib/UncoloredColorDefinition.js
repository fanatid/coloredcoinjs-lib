/* globals Promise:true */
var inherits = require('util').inherits
var Promise = require('bluebird')

var ColorDefinition = require('./ColorDefinition')
var ColorTarget = require('./ColorTarget')
var errors = require('./errors')
var util = require('./util')

var UncoloredColorId = 0

/**
 * @class UncoloredColorDefinition
 * @extends ColorDefinition
 */
function UncoloredColorDefinition () {
  ColorDefinition.call(this, UncoloredColorId)
}

inherits(UncoloredColorDefinition, ColorDefinition)

/**
 * @return {string}
 */
UncoloredColorDefinition.prototype.getColorCode = function () {
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
    throw new errors.ColorDefinitionBadColorIdError('UncoloredColorDefinition.fromDesc')
  }

  if (desc !== '') {
    throw new errors.ColorDefinitionBadDescError('Uncolored fail load: ' + desc)
  }

  return new UncoloredColorDefinition()
}

/**
 * Create ComposedTx from OperationalTx
 *
 * @param {OperationalTx} operationalTx
 * @param {ColorDefinition~transformToComposedTxCallback} cb
 */
UncoloredColorDefinition.makeComposedTx = function (operationalTx, cb) {
  var composedTx
  var targets
  var targetsTotalValue

  return Promise.try(function () {
    targets = operationalTx.getTargets()
    targetsTotalValue = ColorTarget.sum(targets)

    composedTx = operationalTx.makeComposedTx()
    composedTx.addTxOuts(targets.map(function (target) { return {target: target} }))

    return Promise.fromNode(operationalTx.selectCoins.bind(operationalTx, targetsTotalValue, composedTx))
  })
  .spread(function (coins, coinsValue) {
    composedTx.addTxIns(coins.map(function (coin) { return coin.toRawCoin() }))

    var fee = composedTx.estimateRequiredFee()
    var change = coinsValue.minus(targetsTotalValue).minus(fee)

    if (change.getValue() > operationalTx.getDustThreshold().getValue()) {
      var changeAddress = operationalTx.getChangeAddress(new UncoloredColorDefinition())
      composedTx.addTxOut({
        script: util.address2script(changeAddress).toHex(),
        value: change.getValue()
      })
    }

    return composedTx
  })
  .asCallback(cb)
}

module.exports = UncoloredColorDefinition
