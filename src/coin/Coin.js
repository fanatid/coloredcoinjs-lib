var assert = require('assert')

var _ = require('lodash')
var Q = require('q')

var color = require('../color')
var Transaction = require('../tx').Transaction


/**
 * @class Coin
 *
 * @param {Object} data
 * @param {ColorData} data.colorData
 * @param {ColorDefinitionManager} data.colorDefinitionManager
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @param {number} data.value
 * @param {string} data.script
 * @param {string} data.address
 * @param {boolean} data.confirmed
 */
function Coin(data) {
  this.cdManager = data.colorDefinitionManager
  this.cData = data.colorData

  this.txId = data.txId
  this.outIndex = data.outIndex
  this.value = data.value
  this.script = data.script
  this.address = data.address
  this.confirmed = data.confirmed
}

/**
 * Return true if Coin in blockchain
 *
 * @return {boolean}
 */
Coin.prototype.isConfirmed = function() {
  return this.confirmed
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
    if (coinColorValue === null)
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
