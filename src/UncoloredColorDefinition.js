var inherits = require('util').inherits

var Q = require('q')

var ColorDefinition = require('./ColorDefinition')
var ColorTarget = require('./ColorTarget')
var util = require('./util')


var UncoloredColorId = 0


/**
 * @class UncoloredColorDefinition
 * @extends ColorDefinition
 */
function UncoloredColorDefinition() {
  ColorDefinition.call(this, UncoloredColorId)
}

inherits(UncoloredColorDefinition, ColorDefinition)

/**
 * @return {string}
 */
UncoloredColorDefinition.prototype.getColorType = function() {
  return 'uncolored'
}

/**
 * @return {string}
 */
UncoloredColorDefinition.prototype.getDesc = function() {
  return ''
}

/**
 * @param {number} colorId
 * @param {string} desc
 * @return {UncoloredColorDefinition}
 * @throws {Error} If colorId not equal UncoloredColorDefinition.colorId or desc not equal ''
 */
UncoloredColorDefinition.fromDesc = function(colorId, desc) {
  if (colorId !== UncoloredColorId)
    throw new Error('wrong colorId')

  if (desc !== '')
    throw new Error('bad desc')

  return new UncoloredColorDefinition()
}

/**
 * @callback UncoloredColorDefinition~makeComposedTx
 * @param {?Error} error
 * @param {ComposedTx} composedTx
 */

/**
 * Create ComposedTx from OperationalTx
 *
 * @param {OperationalTx} operationalTx
 * @param {UncoloredColorDefinition~makeComposedTx} cb
 */
UncoloredColorDefinition.makeComposedTx = function(operationalTx, cb) {
  var composedTx
  var targets, targetsTotalValue

  Q.fcall(function() {
    targets = operationalTx.getTargets()
    targetsTotalValue = ColorTarget.sum(targets)

    composedTx = operationalTx.makeComposedTx()
    composedTx.addTxOuts(targets.map(function(target) { return {target: target} }))

    return Q.ninvoke(operationalTx, 'selectCoins', targetsTotalValue, composedTx)

  }).spread(function(coins, coinsValue) {
    composedTx.addTxIns(coins)

    var fee = composedTx.estimateRequiredFee()
    var change = coinsValue.minus(targetsTotalValue).minus(fee)

    if (change.getValue() > operationalTx.getDustThreshold().getValue()) {
      var changeAddress = operationalTx.getChangeAddress(new UncoloredColorDefinition())
      composedTx.addTxOut({
        script: util.address2script(changeAddress),
        value: change.getValue()
      })
    }

  }).done(function() { cb(null, composedTx) }, function(error) { cb(error) })
}


module.exports = UncoloredColorDefinition
