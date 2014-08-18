var inherits = require('util').inherits

var Q = require('q')

var ColorDefinition = require('./ColorDefinition')


var UncoloredColorId = 0


/**
 * @class UncoloredColorDefinition
 *
 * Inherits ColorDefinition
 */
function UncoloredColorDefinition() {
  ColorDefinition.call(this, UncoloredColorId)
}

inherits(UncoloredColorDefinition, ColorDefinition)

/**
 * @return {string}
 */
UncoloredColorDefinition.prototype.getScheme = function() {
  return ''
}

/**
 * @param {number} colorId
 * @param {string} sceme
 * @return {UncoloredColorDefinition}
 * @throws {Error} If colorId not equal UncoloredColorDefinition.colorId or scheme not equal ''
 */
UncoloredColorDefinition.fromScheme = function(colorId, scheme) {
  if (colorId !== UncoloredColorId)
    throw new Error('wrong colorId')

  if (scheme !== '')
    throw new Error('bad scheme')

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
    targetsTotalValue = require('./ColorTarget').sum(targets) // require loop

    composedTx = operationalTx.makeComposedTx()
    composedTx.addTxOuts(targets)

    return Q.ninvoke(operationalTx, 'selectCoins', targetsTotalValue, composedTx)

  }).spread(function(coins, coinsValue) {
    composedTx.addTxIns(coins)

    var fee = composedTx.estimateRequiredFee()
    var change = coinsValue.minus(targetsTotalValue).minus(fee)

    if (change.getValue() > operationalTx.getDustThreshold().getValue())
      composedTx.addTxOut({
        address: operationalTx.getChangeAddress(new UncoloredColorDefinition()),
        value: change.getValue()
      })

  }).then(function() {
    cb(null, composedTx)

  }).fail(function(error) {
    cb(error)

  }).done()
}


module.exports = UncoloredColorDefinition
