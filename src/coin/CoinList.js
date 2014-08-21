var assert = require('assert')

var _ = require('lodash')
var Q = require('q')

var Coin = require('./Coin')


/**
 * @class CoinList
 *
 * @param {Coin[]}
 */
function CoinList(coins) {
  assert(_.isArray(coins), 'Expected Array coins, got ' + coins)
  coins.forEach(function(coin) {
    assert(coin instanceof Coin, 'Expected Array of Coin coins, got ' + coins)
  })

  var self = this

  self.coins = coins

  self.length = self.coins.length
  self.coins.forEach(function(coin, index) {
    self[index] = coin
  })
}

/**
 * @return {Coin[]}
 */
CoinList.prototype.getCoins = function() {
  return this.coins
}

/**
 * @callback CoinList~getTotalValue
 * @param {?Error} error
 * @param {ColorValue[]} colorValues
 */

/**
 * @param {CoinList~getTotalValue} cb
 */
CoinList.prototype.getTotalValue = function(cb) {
  var self = this

  Q.fcall(function() {
    var dColorValues = {}

    function getMainColorValue(index) {
      if (index === self.coins.length)
        return dColorValues

      return Q.ninvoke(self.coins[index], 'getMainColorValue')
        .then(function(colorValue) {
          var colorId = colorValue.getColorId()

          if (_.isUndefined(dColorValues[colorId]))
            dColorValues[colorId] = colorValue
          else
            dColorValues[colorId] = dColorValues[colorId].plus(colorValue)

          return getMainColorValue(index + 1)
        })
    }

    return getMainColorValue(0)

  })
  .then(function(dColorValues) {
    var colorValues = Object.keys(dColorValues).map(function(colorId) {
      return dColorValues[colorId]
    })

    return colorValues

  })
  .done(function(colorValues) { cb(null, colorValues) }, function(error) { cb(error) })
}


module.exports = CoinList
