'use strict'

var inherits = require('util').inherits
var Promise = require('bluebird')

var _ = require('lodash')

var OperationalTx = require('./operational')
var ColorValue = require('../colorvalue')
var UncoloredColorDefinition = require('../definitions/uncolored')
var errors = require('../errors')

/**
 * @class SimpleOperationalTx
 * @extends OperationalTx
 * @param {Object} data
 * @param {ColorTarget[]} data.targets
 * @param {Object} data.coins
 * @param {OperationalTx~AbstractRawCoin[]} data.coins.colorIdN
 * @param {Object} data.changeAddresses
 * @param {string} data.changeAddresses.colorIdN
 * @param {number} [data.fee] If omitted than fee will be calcaultaed automatically
 */
function SimpleOperationalTx (data) {
  OperationalTx.call(this)
  this.addTargets(data.targets)

  this._data = data
}

inherits(SimpleOperationalTx, OperationalTx)
_.extend(SimpleOperationalTx, OperationalTx)

/**
 * @param {ColorValue} cvalue
 * @param {FeeEstimator} [feeEstimator]
 * @return {Promise.<OperationalTx~selectCoinsResult>}
 */
SimpleOperationalTx.prototype.selectCoins = function (colorValue, feeEstimator) {
  var self = this
  return Promise.try(function () {
    if (feeEstimator === undefined) {
      feeEstimator = null
    }

    if (feeEstimator !== null && !colorValue.isUncolored()) {
      throw new errors.Tx.Operational.FeeEstimator(
        'feeEstimator can only be used with uncolored coins')
    }

    var coins = []
    var totalValue = 0
    self._data.coins[colorValue.getColorId()].some(function (coin) {
      coins.push({toRawCoin: function () { return _.cloneDeep(coin)}})
      totalValue += coin.value

      var neededValue = colorValue.getValue()
      if (feeEstimator !== null) {
        var fee = feeEstimator.estimateRequiredFee({inputs: coins.length})
        neededValue += fee.getValue()
      }

      return totalValue >= neededValue
    })

    var total = new ColorValue(colorValue.getColorDefinition(), totalValue)

    return {coins: coins, total: total}
  })
}

/**
 * @param {IColorDefinition} cdef
 * @return {Promise.<string>}
 */
SimpleOperationalTx.prototype.getChangeAddress = function (cdef) {
  return Promise.resolve(this._data.changeAddresses[cdef.getColorId()])
}

/**
 * @param {number} txSize Transaction size in bytes
 * @param {number} [feePerKb=10000] Satoshis-per-kilobyte
 * @return {ColorValue}
 */
SimpleOperationalTx.prototype.getRequiredFee = function () {
  if (this._data.fee === undefined) {
    return OperationalTx.prototype.apply(this, arguments)
  }

  return new ColorValue(new UncoloredColorDefinition(), this._data.fee)
}

module.exports = SimpleOperationalTx
