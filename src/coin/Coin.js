var assert = require('assert')

var _ = require('lodash')
var Q = require('q')

var color = require('../color')
var Transaction = require('../tx').Transaction


/**
 * @class Coin
 *
 * @param {Object} params
 * @param {ColorData} params.colorData
 * @param {ColorDefinitionManager} params.colorDefinitionManager
 * @param {string} params.address
 * @param {string} params.txId
 * @param {number} params.outIndex
 * @param {number} params.value
 * @param {number} params.confirmations
 */
function Coin(params) {
  assert(_.isObject(params), 'Expected Object params, got ' + params)
  assert(params.colorData instanceof color.ColorData,
    'Expected params.colorData instanceof ColorData, got ' + params.colorData)
  assert(params.colorDefinitionManager instanceof color.ColorDefinitionManager,
    'Expected params.colorDefinitionManager instanceof ColorDefinitionManager, got ' + params.colorDefinitionManager)
  assert(Transaction.isTxId(params.txId), 'Expected transaction id params.txId, got ' + params.txId)
  assert(_.isNumber(params.outIndex), 'Expected number params.outIndex, got ' + params.outIndex)
  assert(_.isNumber(params.value), 'Expected number params.value, got ' + params.value)
  assert(_.isNumber(params.confirmations), 'Expected number params.confirmations, got ' + params.confirmations)

  this.cdManager = params.colorDefinitionManager
  this.cData = params.colorData
  this.address = params.address
  this.txId = params.txId
  this.outIndex = params.outIndex
  this.value = params.value
  this.confirmations = params.confirmations
}

/**
 * Return true if Coin in blockchain
 *
 * @return {boolean}
 */
Coin.prototype.isConfirmed = function() {
  return this.confirmations > 0
}

/**
 * @callback Coin~getColorValue
 * @param {?Error} error
 * @param {ColorValue} colorValue
 */

/**
 * Get ColorValue for current Coin and given ColorDefinition
 *
 * @param {ColorDefinition} colorDefinition
 * @param {Coin~getColorValue} cb
 */
Coin.prototype.getColorValue = function(colorDefinition, cb) {
  assert(colorDefinition instanceof color.ColorDefinition,
    'Expected colorDefinition instanceof ColorDefinition, got ' + colorDefinition)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.cData.getColorValue(this.txId, this.outIndex, colorDefinition, cb)
}

/**
 * @callback Coin~getMainColorValue
 * @param {?Error} error
 * @param {ColorValue} coinColorValue
 */

/**
 * Get one ColorValue or error if more than one
 *
 * @param {Coin~getMainColorValue} cb
 */
Coin.prototype.getMainColorValue = function (cb) {
  var self = this

  Q.fcall(function() {
    var coinColorValue = null
    var colorDefinitions = self.cdManager.getAllColorDefinitions()

    function getColorValue(index) {
      if (index === colorDefinitions.length)
        return coinColorValue

      return Q.ninvoke(self, 'getColorValue', colorDefinitions[index])
        .then(function(colorValue) {
          if (coinColorValue !== null && colorValue !== null)
            throw new Error('Coin ' + self + ' have more that one ColorValue')

          coinColorValue = colorValue

          return getColorValue(index + 1)
        })
    }

    return getColorValue(0)

  })
  .then(function(coinColorValue) {
    if (coinColorValue == null)
      coinColorValue = new color.ColorValue(self.cdManager.getUncolored(), self.value)

    return coinColorValue

  })
  .done(function(coinColorValue) { cb(null, coinColorValue) }, function(error) { cb(error) })
}

/**
 * @return {string}
 */
Coin.prototype.toString = function() {
  return this.txId + ':' + this.outIndex
}


module.exports = Coin
