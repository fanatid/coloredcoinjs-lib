var _ = require('lodash')
var Q = require('q')

var Coin = require('./Coin')
var CoinList = require('./CoinList')


/**
 * @class CoinQuery
 *
 * @param {Object} opts
 * @param {BlockchainStateBase} opts.blockchain
 * @param {ColorData} opts.colorData
 * @param {ColorDefinitionManager} opts.colorDefinitionManager
 * @param {string[]} opts.addresses
 */
function CoinQuery(opts) {
  this.blockchain = opts.blockchain
  this.colorData = opts.colorData
  this.cdManager = opts.colorDefinitionManager
  this.addresses = opts.addresses

  this.query = {
    onlyColoredAs: null,
    onlyAddresses: null,
    onlyConfirmed: false,
    onlyUnconfirmed: false
  }
}

/**
 * Return clone of current CoinQuery
 *
 * @return {CoinQuery}
 */
CoinQuery.prototype.clone = function() {
  var newCoinQuery = new CoinQuery({
    addresses: this.addresses,
    blockchain: this.blockchain,
    colorData: this.colorData,
    colorDefinitionManager: this.cdManager
  })

  newCoinQuery.query = _.clone(this.query)

  return newCoinQuery
}

/**
 * Select coins only for given ColorDefinition
 *
 * @param {(ColorDefinition|ColorDefinition[])} data
 * @return {CoinQuery}
 */
CoinQuery.prototype.onlyColoredAs = function(data) {
  if (!_.isArray(data))
    data = [data]

  var newCoinQuery = this.clone()
  newCoinQuery.query.onlyColoredAs = data.map(function(cd) { return cd.getColorId() })

  return newCoinQuery
}

/**
 * Select coins only belong to given addresses
 *
 * @param {(string|string[])} data
 * @return {CoinQuery}
 */
CoinQuery.prototype.onlyAddresses = function(data) {
  if (!_.isArray(data))
    data = [data]

  var newCoinQuery = this.clone()
  newCoinQuery.query.onlyAddresses = data

  return newCoinQuery
}

/**
 * Select only confirmed coins
 *
 * @return {CoinQuery}
 */
CoinQuery.prototype.getConfirmed = function() {
  var newCoinQuery = this.clone()
  newCoinQuery.query.onlyConfirmed = true
  newCoinQuery.query.onlyUnconfirmed = false

  return newCoinQuery
}

/**
 * Select only unconfirmed coins
 *
 * @return {CoinQuery}
 */
CoinQuery.prototype.getUnconfirmed = function() {
  var newCoinQuery = this.clone()
  newCoinQuery.query.onlyConfirmed = false
  newCoinQuery.query.onlyUnconfirmed = true

  return newCoinQuery
}

/**
 * @callback CoinQuery~getCoins
 * @param {?Error} error
 * @param {CoinList} coinList
 */

/**
 * Select coins and return CoinList via cb
 *
 * @param {CoinQuery~getCoins} cb
 */
CoinQuery.prototype.getCoins = function(cb) {
  var self = this

  var addresses = self.addresses
  if (self.query.onlyAddresses !== null)
    addresses = addresses.filter(function(address) { return self.query.onlyAddresses.indexOf(address) !== -1 })

  Q.fcall(function() {
    var utxo = []

    function getUTXO(index) {
      if (addresses.length === index)
        return utxo

      return Q.ninvoke(self.blockchain, 'getUTXO', addresses[index])
        .then(function(addressUTXO) {
          utxo = utxo.concat(addressUTXO)
          return getUTXO(index + 1)
        })
    }

    return getUTXO(0)

  }).then(function(utxo) {
    var coins = []

    function filterUTXO(index) {
      if (utxo.length === index)
        return coins

      return Q.fcall(function() {
        var coin = new Coin({
          colorData: self.colorData,
          colorDefinitionManager: self.cdManager,
          address: utxo[index].address,
          txId: utxo[index].txId,
          outIndex: utxo[index].outIndex,
          value: utxo[index].value,
          confirmations: utxo[index].confirmations
        })

        if (self.query.onlyConfirmed && !coin.isConfirmed())
          return

        if (self.query.onlyUnconfirmed && coin.isConfirmed())
          return

        if (self.query.onlyColoredAs === null) {
          coins.push(coin)
          return
        }

        return Q.ninvoke(coin, 'getMainColorValue')
          .then(function(colorValue) {
            if (self.query.onlyColoredAs.indexOf(colorValue.getColorId()) !== -1)
              coins.push(coin)

          })

      }).then(function() {
        return filterUTXO(index + 1)

      })
    }

    return filterUTXO(0)

  }).done(function(coins) { cb(null, new CoinList(coins)) }, function(error) { cb(error) })
}

//Todo
//CoinQuery.prototype.getHistory = function() {}


module.exports = CoinQuery
