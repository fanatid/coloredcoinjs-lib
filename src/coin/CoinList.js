var assert = require('assert')

var _ = require('lodash')

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
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this
  var dColorValues = {}

  function getMainColorValue(index) {
    if (_this.coins.length === index) {
      var colorValues = Object.keys(dColorValues).map(function(colorId) {
        return dColorValues[colorId]
      })

      cb(null, colorValues)
      return
    }

    _this.coins[index].getMainColorValue(function(error, colorValue) {
      if (error !== null) {
        cb(error)
        return
      }

      var colorId = colorValue.getColorId()

      if (_.isUndefined(dColorValues[colorId]))
        dColorValues[colorId] = colorValue
      else
        dColorValues[colorId] = dColorValues[colorId].plus(colorValue)

      getMainColorValue(index+1)
    })
  }

  getMainColorValue(0)
}


module.exports = CoinList
