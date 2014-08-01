var assert = require('assert')

var _ = require('lodash')

var ColorDefinitionManager = require('./ColorDefinitionManager')
var ColorData = require('./ColorData')
var ColorDefinition = require('./colordef').ColorDefinition
var ColorValue = require('./ColorValue')
var Transaction = require('./Transaction')


/**
 * @class Coin
 *
 * @param {Object} params
 * @param {ColorData} params.colorData
 * @param {ColorDefinitionManager} params.colorDefinitionManager
 * @param {string} params.txId
 * @param {number} params.outIndex
 * @param {number} params.value
 * @param {number} params.confirmations
 */
function Coin(params) {
  assert(_.isObject(params), 'Expected Object params, got ' + params)
  assert(params.colorData instanceof ColorData,
    'Expected params.colorData instanceof ColorData, got ' + params.colorData)
  assert(params.colorDefinitionManager instanceof ColorDefinitionManager,
    'Expected params.colorDefinitionManager instanceof ColorDefinitionManager, got ' + params.colorDefinitionManager)
  assert(Transaction.isTxId(params.txId), 'Expected transaction id params.txId, got ' + params.txId)
  assert(_.isNumber(params.outIndex), 'Expected number params.outIndex, got ' + params.outIndex)
  assert(_.isNumber(params.value), 'Expected number params.value, got ' + params.value)
  assert(_.isNumber(params.confirmations), 'Expected number params.confirmations, got ' + params.confirmations)

  this.cDefinitionManager = params.colorDefinitionManager
  this.cData = params.colorData
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
 * Get ColorValue for current Coin and given ColorDefinition
 *
 * @param {ColorDefinition} colorDefinition
 * @param {function} cb
 */
Coin.prototype.getColorValue = function(colorDefinition, cb) {
  assert(colorDefinition instanceof ColorDefinition,
    'Expected colorDefinition instanceof ColorDefinition, got ' + colorDefinition)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.cData.getColorValue(this.txId, this.outIndex, colorDefinition, cb)
}

/**
 * Get one ColorValue or error if more than one
 *
 * @param {function} cb
 */
Coin.prototype.getMainColorValue = function (cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  var coinColorValue = null
  var colorDefinitions = this.cDefinitionManager.getAllColorDefinitions()

  function getColorValue(index) {
    if (colorDefinitions.length === index) {
      if (coinColorValue === null) {
        var uncolored = _this.cDefinitionManager.getUncolored()
        coinColorValue = new ColorValue({ colordef: uncolored, value: _this.value })
      }

      cb(null, coinColorValue)
      return
    }

    _this.getColorValue(colorDefinitions[index], function(error, colorValue) {
      if (error === null && colorValue !== null) {
        if (coinColorValue === null)
          coinColorValue = colorValue
        else
          error = new Error('Coin ' + _this + ' have more that one ColorValue')
      }

      if (error !== null) {
        cb(error)
        return
      }

      getColorValue(index+1)
    })
  }

  getColorValue(0)
}

/**
 * @return {string}
 */
Coin.prototype.toString = function() {
  return this.txId + ':' + this.outIndex
}


module.exports = Coin
