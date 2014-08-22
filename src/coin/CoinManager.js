var _ = require('lodash')
var Q = require('q')

var Coin = require('./Coin')


/**
 * @class CoinManager
 *
 * @param {CoinStorage} coinStorage
 */
function CoinManager(coinStorage, colorData, colorDefinitionManager, blockchain) {
  this.storage = coinStorage
  this.cData = colorData
  this.cdManager = colorDefinitionManager
  this.blockchain = blockchain
}

/**
 * @param {Object} rawCoin
 * @param {string} rawCoin.txId
 * @param {number} rawCoin.outIndex
 * @param {number} rawCoin.value
 * @param {string} rawCoin.script
 * @param {string} rawCoin.address
 */
CoinManager.prototype.addCoin = function(rawCoin) {
  if (this.storage.get(rawCoin.txId, rawCoin.outIndex) === null)
    this.storage.addCoin(rawCoin)
}

/**
 * @param {string} txId
 * @param {number} outIndex
 */
CoinManager.prototype.markCoinAsSpend = function(txId, outIndex) {
  this.storage.markCoinAsSpend(txId, outIndex)
}

/**
 * @param {CoinStorageRecord} record
 * @return {Coin}
 */
CoinManager.prototype.record2Coin = function(record) {
  var coin = new Coin({
    colorData: this.cData,
    colorDefinitionManager: this.cdManager,

    txId: record.txId,
    outIndex: record.outIndex,
    value: record.value,
    script: record.script,
    address: record.address
  })

  return coin
}

/**
 * @param {string} address
 * @return {Coin[]}
 */
CoinManager.prototype.getCoinsForAddress = function(address) {
  var records = this.storage.getForAddress(address)
  return records.map(this.record2Coin.bind(this))
}

/**
 * @callback CoinManager~getCoins
 * @param {?Error} error
 */

/**
 * Need move... and rewrite, we need txdb...
 * @param {CoinManager~getCoins} cb
 */
CoinManager.prototype.updateCoins = function(addresses, cb) {
  var self = this

  Q.fcall(function() {
    var utxo = []

    var promises = []
    addresses.forEach(function(address) {
      promises.push( Q.ninvoke(self.blockchain, 'getUTXO', address).then(utxo.push.bind(utxo)) )
    })

    return Q.all(promises).then(function() { return _.flatten(utxo) })

  }).then(function(utxo) {
    utxo.forEach(function(rawCoin) {
      self.addCoin({
        txId: rawCoin.txId,
        outIndex: rawCoin.outIndex,
        value: rawCoin.value,
        script: rawCoin.script,
        address: rawCoin.address
      })
    })

  }).done(function() { cb(null) }, function(error) { cb(error) })
}


module.exports = CoinManager
