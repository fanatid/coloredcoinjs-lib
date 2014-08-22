var _ = require('lodash')
var Q = require('q')

var Coin = require('./Coin')
var CoinList = require('./CoinList')


/**
 * @class CoinQuery
 *
 * @param {Object} data
 * @param {BlockchainStateBase} data.blockchain
 * @param {ColorData} data.colorData
 * @param {ColorDefinitionManager} data.colorDefinitionManager
 * @param {string[]} data.addresses
 */
function CoinQuery(data) {
  this.blockchain = data.blockchain
  this.colorData = data.colorData
  this.cdManager = data.colorDefinitionManager
  this.addresses = data.addresses

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

    var promises = []
    addresses.forEach(function(address) {
      promises.push( Q.ninvoke(self.blockchain, 'getUTXO', address).then(utxo.push.bind(utxo)) )
    })

    return Q.all(promises).then(function() { return _.flatten(utxo) })

  }).then(function(utxo) {
    var coins = []

    var promises = []
    utxo.forEach(function(rawCoin) {
      var promise = Q.fcall(function() {
        var coin = new Coin({
          colorData: self.colorData,
          colorDefinitionManager: self.cdManager,
          txId: rawCoin.txId,
          outIndex: rawCoin.outIndex,
          value: rawCoin.value,
          script: rawCoin.script,
          address: rawCoin.address,
          confirmed: rawCoin.confirmed
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
      })

      promises.push(promise)
    })

    return Q.all(promises).then(function() { return coins })

  }).done(function(coins) { cb(null, new CoinList(coins)) }, function(error) { cb(error) })
}

//Todo
//CoinQuery.prototype.getHistory = function() {}


module.exports = CoinQuery
