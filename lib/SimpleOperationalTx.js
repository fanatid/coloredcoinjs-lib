var inherits = require('util').inherits

var _ = require('lodash')

var OperationalTx = require('./OperationalTx')
var ColorValue = require('./ColorValue')
var ColorDefinitionManager = require('./ColorDefinitionManager')

/**
 * @class SimpleOperationalTx
 * @extends OperationalTx
 * @param {Object} data
 * @param {ColorTarget[]} data.targets
 * @param {OperationalTx~AbstractRawCoin[]} data.coins
 * @param {Object} data.changeAddresses
 * @param {string} data.changeAddresses.colorId1
 * @param {string} data.changeAddresses.colorIdN
 * @param {number} data.fee
 */
function SimpleOperationalTx (data) {
  OperationalTx.call(this)

  this._data = data
}

inherits(SimpleOperationalTx, OperationalTx)

/**
 * @{link OperationalTx~getTargets}
 */
SimpleOperationalTx.prototype.getTargets = function () {
  return this._data.targets
}

/**
 * @{link OperationalTx~selectCoins}
 */
SimpleOperationalTx.prototype.selectCoins = function (colorValue, feeEstimator, cb) {
  if (_.isUndefined(cb)) {
    cb = feeEstimator
    feeEstimator = null
  }
  if (_.isUndefined(feeEstimator)) { feeEstimator = null }
  if (feeEstimator !== null && !colorValue.isUncolored()) {
    throw new TypeError('feeEstimator can only be used with uncolored coins')
  }

  var coins = []
  var totalValue = 0
  this._data.coins.some(function (coin) {
    if (coin.colorId !== colorValue.getColorId()) {
      return false
    }

    coins.push({toRawCoin: function () { return coin }})
    totalValue += coin.value

    var neededValue = colorValue.getValue()
    if (feeEstimator !== null) {
      neededValue += feeEstimator.estimateRequiredFee({extraTxIns: coins.length}).getValue()
    }

    return totalValue >= neededValue
  })

  var totalColorValue = new ColorValue(colorValue.getColorDefinition(), totalValue)

  cb(null, coins, totalColorValue)
}

/**
 * @{linkcode OperationalTx~getChangeAddress}
 */
SimpleOperationalTx.prototype.getChangeAddress = function (colordef) {
  return this._data.changeAddresses[colordef.getColorId()]
}

/**
 * @{link OperationalTx~getRequiredFee}
 */
SimpleOperationalTx.prototype.getRequiredFee = function () {
  return new ColorValue(ColorDefinitionManager.getUncolored(), this._data.fee)
}

/**
 * @{link OperationalTx~getDustThreshold}
 */
SimpleOperationalTx.prototype.getDustThreshold = function () {
  return new ColorValue(ColorDefinitionManager.getUncolored(), 5500)
}

module.exports = SimpleOperationalTx
