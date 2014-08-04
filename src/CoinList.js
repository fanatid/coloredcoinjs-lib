var assert = require('assert')

var _ = require('lodash')

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

  this.length = coins.length

  var _this = this
  coins.forEach(function(coin, index) {
    _this[index] = coin
  })
}

/**
 * @param {function} cb
 */
CoinList.prototype.getTotalValue = function(cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this
  var dColorValues = {}
  function getMainColorValue(index) {
    if (_this.coins.length === index) {
      var colorValues = []
      Object.keys(dColorValues).forEach(function(colorId) {
        colorValues.push(dColorValues[colorId])
      })

      cb(null, colorValues) // Todo: return ColorValue if colorValues.length === 1 ?
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
        dColorValues[colorId].add(colorValue)

      getMainColorValue(index+1)
    })
  }

  getMainColorValue(0)
}


module.exports = CoinList
