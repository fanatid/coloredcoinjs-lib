var inherits = require('util').inherits

var _ = require('lodash')

var cclib = require('../../src')


/**
 * @class SimpleOperationalTx
 * @extends cclib.OperationalTx
 * @param {Object} data
 * @param {ColorTarget[]} data.targets
 * @param {{colorId: number, txId: string, outIndex: number, value: number}[]} data.coins
 * @param {{colorId1: string, colorIdN: string}} data.changeAddresses
 * @param {number} data.fee
 */
function SimpleOperationalTx(data) {
  cclib.OperationalTx.call(this)

  this._data = data
}

inherits(SimpleOperationalTx, cclib.OperationalTx)

/**
 * @return {ColorTarget[]}
 */
SimpleOperationalTx.prototype.getTargets = function () {
  return this._data.targets
}

/**
 * @param {ColorValue} colorValue
 * @param {?Object} [feeEstimator]
 * @param {OperationalTx~selectCoins} cb
 */
SimpleOperationalTx.prototype.selectCoins = function (colorValue, feeEstimator, cb) {
  var coins = this._data.coins.filter(function (coin) {
    return coin.colorId === colorValue.getColorId()
  })

  var fakeCoins = coins.map(function (coin) {
    return {toRawCoin: function () { return coin }}
  })
  var totalValue = _.pluck(coins, 'value').reduce(function (v, t) { return v + t }, 0)
  var totalColorValue = new cclib.ColorValue(colorValue.getColorDefinition(), totalValue)

  var callback = _.isUndefined(cb) ? feeEstimator : cb
  callback(null, fakeCoins, totalColorValue)
}

/**
 * @param {ColorDefinition} colorDefinition
 * @return {string}
 */
SimpleOperationalTx.prototype.getChangeAddress = function (colordef) {
  return this._data.changeAddresses[colordef.getColorId()]
}

/**
 * @param {number} txSize
 * @return {ColorValue}
 */
SimpleOperationalTx.prototype.getRequiredFee = function () {
  return new cclib.ColorValue(new cclib.ColorDefinitionManager.getUncolored(), this._data.fee)
}

/**
 * @return {ColorValue}
 */
SimpleOperationalTx.prototype.getDustThreshold = function () {
  return new cclib.ColorValue(new cclib.ColorDefinitionManager.getUncolored(), 5500)
}


module.exports = SimpleOperationalTx
