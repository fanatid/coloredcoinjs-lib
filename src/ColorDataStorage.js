var inherits = require('util').inherits

var _ = require('lodash')

var SyncStorage = require('./SyncStorage')
var verify = require('./verify')


/**
 * @typedef {Object} ColorDataRecord
 * @property {number} colorId
 * @property {string} txId
 * @property {number} outIndex
 * @property {number} value
 */

/**
 * @class ColorDataStorage
 * @extends SyncStorage
 */
function ColorDataStorage() {
  SyncStorage.apply(this, Array.prototype.slice.call(arguments))

  this.colorTxsDBKey = this.globalPrefix + 'colorTxs'
}

inherits(ColorDataStorage, SyncStorage)

/**
 * @return {ColorDataRecord[]}
 */
ColorDataStorage.prototype._getCoinRecords = function() {
  return this.store.get(this.colorTxsDBKey) || []
}

/**
 * @param {ColorDataRecord[]}
 */
ColorDataStorage.prototype._saveCoinRecords = function(coins) {
  this.store.set(this.colorTxsDBKey, coins)
}

/**
 * @param {ColorDataRecord} data
 * @return {ColorDataRecord}
 * @throws {Error} If exists
 */
ColorDataStorage.prototype.add = function(data) {
  verify.object(data)
  verify.number(data.colorId)
  verify.txId(data.txId)
  verify.number(data.outIndex)
  verify.number(data.value)

  if (this.get(data) !== null)
    throw new Error('Same color data exists')

  var record = {
    colorId: data.colorId,
    txId: data.txId,
    outIndex: data.outIndex,
    value: data.value
  }

  var records = this._getCoinRecords()
  records.push(record)
  this._saveCoinRecords(records)

  return record
}

/**
 * @param {Object} data
 * @param {number} data.colorId
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @return {?ColorDataRecord}
 */
ColorDataStorage.prototype.get = function(data) {
  verify.object(data)
  verify.number(data.colorId)
  verify.txId(data.txId)
  verify.number(data.outIndex)

  var record = _.find(this._getCoinRecords(), function(obj) {
    return obj.colorId === data.colorId && obj.txId === data.txId && obj.outIndex === data.outIndex
  })

  return record || null
}

/**
 * @param {number} [colorId]
 * @param {string} [txId]
 * @param {number} [outIndex]
 */
ColorDataStorage.prototype.remove = function(data) {
  verify.object(data)
  if (_.isUndefined(data.colorId) && _.isUndefined(data.txId) && _.isUndefined(data.outIndex))
    throw new Error('Bad data')
  if (!_.isUndefined(data.colorId)) verify.number(data.colorId)
  if (!_.isUndefined(data.txId)) verify.txId(data.txId)
  if (!_.isUndefined(data.outIndex)) verify.number(data.outIndex)

  var records = this._getCoinRecords().filter(function(record) {
    if (!_.isUndefined(data.colorId) && record.colorId !== data.colorId) return true
    if (!_.isUndefined(data.txId) && record.txId !== data.txId) return true
    if (!_.isUndefined(data.outIndex) && record.outIndex !== data.outIndex) return true
    return false
  })
  this._saveCoinRecords(records)
}

/**
 * Remove all colorTxs
 */
ColorDataStorage.prototype.clear = function() {
  this.store.remove(this.colorTxsDBKey)
}


module.exports = ColorDataStorage
