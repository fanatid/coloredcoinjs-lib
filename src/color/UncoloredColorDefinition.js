var inherits = require('util').inherits

var Q = require('q')

var ColorDefinition = require('./ColorDefinition')
var tx = require('../tx')


/**
 * @class UncoloredColorDefinition
 *
 * Inherits ColorDefinition
 */
function UncoloredColorDefinition() {
  ColorDefinition.call(this, { colorId: 0 })
}

inherits(UncoloredColorDefinition, ColorDefinition)

UncoloredColorDefinition.prototype.getScheme = function() {
  return ''
}

/**
 * @callback UncoloredColorDefinition~makeComposedTx
 * @param {?Error} error
 * @param {ComposedTx} composedTx
 */

/**
 * Create ComposeTx from OperationalTx
 *
 * @param {OperationalTx} operationalTx
 * @param {UncoloredColorDefinition~makeComposedTx} cb
 */
UncoloredColorDefinition.makeComposedTx = function(operationalTx, cb) {
  var self = this

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
