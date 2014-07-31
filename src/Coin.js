var assert = require('assert')

var _ = require('underscore')

var ColorDefinitionManager = require('./ColorDefinitionManager')
var ColorData = require('./ColorData')
var ColorValue = require('./ColorValue')
var Transaction = require('./Transaction')


/**
 * @class Coin
 *
 * @param {Object} data
 * @param {ColorDefinitionManager} colorDefinitionManager
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @param {number} data.value
 * @param {number} data.confirmations
 */
function Coin(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(data.colorDefinitionManager instanceof ColorDefinitionManager,
    'Expected ColorDefinitionManager data.colorDefinitionManager, got ' + data.colorDefinitionManager)
  assert(data.colorData instanceof ColorData, 'Expected ColorData data.colorData, got ' + data.colorData)
  assert(Transaction.isTxId(data.txId), 'Expected transaction id data.txId, got ' + data.txId)
  assert(_.isNumber(data.outIndex), 'Expected number data.outIndex, got ' + data.outIndex)
  assert(_.isNumber(data.value), 'Expected number data.value, got ' + data.value)
  assert(_.isNumber(data.confirmations), 'Expected number data.confirmations, got ' + data.confirmations)

  this.cDefinitionManager = data.colorDefinitionManager
  this.cData = data.colorData
  this.txId = data.txId
  this.outIndex = data.outIndex
  this.value = data.value
  this.confirmations = data.confirmations
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
  this.cData.getColorValue(this.txId, this.outIndex, colorDefinition, cb)
}

/**
 * Get all ColorValues for current Coin
 *
 * @param {function} cb
 */
Coin.prototype.getColorValues = function(cb) {
  var _this = this

  var colorValues = {}
  var colorDefinitions = this.cDefinitionManager.getAllColorDefinitions()

  function getColorValue(index) {
    if (colorDefinitions.length === index) {
      var totalValue = 0
      Object.keys(colorValues).forEach(function(colorId) {
        totalValue += colorValues[colorId].getValue()
      })

      if (totalValue < _this.value) {
        var uncolored = _this.cDefinitionManager.getUncolored()
        var uncoloredValue = new ColorValue({ colordef: uncolored, value: _this.value - totalValue })

        colorValues[uncolored.getColorId()] = uncoloredValue
      }

      cb(null, colorValues)
      return
    }

    _this.getColorValue(colorDefinitions[index], function(error, colorValue) {
      if (error !== null) {
        cb(error)
        return
      }

      colorValues[colorValue.getColorId()] = colorValue
      getColorValue(index+1)
    })
  }

  getColorValue(0)
}


module.exports = Coin
