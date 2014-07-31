var assert = require('assert')

var _ = require('underscore')

var Coin = require('./Coin')


/**
 * @class CoinList
 *
 * @param {Array} coins
 */
function CoinList(coins) {
  assert(_.isArray(coins), 'Expected Array coins, got ' + coins)
  coins.forEach(function(coin) {
    assert(coin instanceof Coin, 'Expected Array of Coin coins, got ' + coins)
  })

  this.coins = coins
}

/**
 * Select only unconfirmed coins and return new CoinList
 *
 * @return {CoinList}
 */
CoinList.prototype.onlyUnconfirmed = function() {
  var coins = this.getCoins().filter(function(coin) { return !coin.isConfirmed() })
  return new CoinList(coins)
}

/**
 * Select only confirmed coins and return new CoinList
 *
 * @return {CoinList}
 */
CoinList.prototype.onlyConfirmed = function() {
  var coins = this.getCoins().filter(function(coin) { return coin.isConfirmed() })
  return new CoinList(coins)
}

/**
 * Get coins
 *
 * @return {Array}
 */
CoinList.prototype.getCoins = function() {
  return this.coins
}

/**
 * @param {function} cb
 */
CoinList.prototype.getBalance = function(cb) {
  var _this = this

  var gColorValues = {}
  var coins = this.coins

  function getColorValues(index) {
    if (coins.length === index) {
      cb(null, gColorValues)
      return
    }

    coins[index].getColorValues(function(error, colorValues) {
      if (error !== null) {
        cb(error)
        return
      }

      Object.keys(colorValues).forEach(function(colorId) {
        if (_.isUndefined(gColorValues[colorId]))
          gColorValues[colorId] = colorValues[colorId]
        else
          gColorValues[colorId].add(colorValues[colorId])
      })
    })
  }

  getColorValues(0)
}


module.exports = CoinList
