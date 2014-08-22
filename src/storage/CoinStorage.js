var inherits = require('util').inherits

var _ = require('lodash')

var SyncStorage = require('./SyncStorage')


/**
 * @typedef {Object} CoinStorageRecord
 * @property {string} txId
 * @property {number} outIndex
 * @property {number} value
 * @property {string} script
 * @property {string} address
 * @property {boolean} spends
 */

/**
 * @class CoinStorage
 *
 * Inherits SyncStorage
 */
function CoinStorage() {
  SyncStorage.apply(this, Array.prototype.slice.call(arguments))

  this.dbKey = this.globalPrefix + 'coins'

  if (!_.isArray(this.store.get(this.dbKey)))
    this.store.set(this.dbKey, [])
}

inherits(CoinStorage, SyncStorage)

/**
 * @param {Object} rawCoin
 * @param {string} rawCoin.txId
 * @param {number} rawCoin.outIndex
 * @param {number} rawCoin.value
 * @param {string} rawCoin.script
 * @param {string} rawCoin.address
 * @throws {Error} If coin already exists
 */
CoinStorage.prototype.addCoin = function(rawCoin) {
  var records = this.getAll()
  records.forEach(function(record) {
    if (record.txId === rawCoin.txId && record.outIndex === rawCoin.outIndex)
      throw new Error('Same coin already exists')
  })

  records.push({
    txId: rawCoin.txId,
    outIndex: rawCoin.outIndex,
    value: rawCoin.value,
    script: rawCoin.script,
    address: rawCoin.address,
    spends: false
  })

  this.store.set(this.dbKey, records)
}

/**
 * @param {string} txId
 * @param {number} outIndex
 */
CoinStorage.prototype.markCoinAsSpend = function(txId, outIndex) {
  var records = this.getAll()
  records.forEach(function(record) {
    if (record.txId === txId && record.outIndex === outIndex)
      record.spends = true
  })

  this.store.set(this.dbKey, records)
}

/**
 * @param {string} txId
 * @param {number} outIndex
 * @return {?CoinStorageRecord}
 */
CoinStorage.prototype.get = function(txId, outIndex) {
  var records = this.getAll().filter(function(record) {
    return record.txId === txId && record.outIndex === outIndex
  })

  if (records.length === 1)
    return records[0]

  return null
}

/**
 * @param {string} address
 * @return {CoinStorageRecord[]}
 */
CoinStorage.prototype.getForAddress = function(address) {
  var records = this.getAll().filter(function(record) {
    return record.address === address
  })

  return records
}

/**
 * @return {CoinStorageRecord[]}
 */
CoinStorage.prototype.getAll = function() {
  var coins = this.store.get(this.dbKey) || []
  return coins
}

/**
 * Remove all coins
 */
CoinStorage.prototype.clear = function() {
  this.store.remove(this.dbKey)
}


module.exports = CoinStorage
