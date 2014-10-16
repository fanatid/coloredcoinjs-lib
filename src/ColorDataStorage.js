var assert = require('assert')
var inherits = require('util').inherits

var _ = require('lodash')

var SyncStorage = require('./SyncStorage')
var Transaction = require('./bitcoin').Transaction


/**
 * @class ColorDataStorage
 * @extends SyncStorage
 */
function ColorDataStorage() {
  SyncStorage.apply(this, Array.prototype.slice.call(arguments))

  this.colorTxsDBKey = this.globalPrefix + 'colorTxs'

  if (!_.isArray(this.store.get(this.colorTxsDBKey)))
    this.store.set(this.colorTxsDBKey, [])
}

inherits(ColorDataStorage, SyncStorage)

/**
 * Add colorId txOutput to store and return true if data was added
 *
 * @param {Object} data
 * @param {number} data.colorId
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @param {number} data.value
 * @return {boolean}
 */
ColorDataStorage.prototype.add = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isNumber(data.colorId), 'Expected number data.colorId, got ' + data.colorId)
  assert(Transaction.isTxId(data.txId), 'Expected transaction id data.txId, got ' + data.txId)
  assert(_.isNumber(data.outIndex), 'Expected number data.outIndex, got ' + data.outIndex)
  assert(_.isNumber(data.value), 'Expected number data.value, got ' + data.value)

  var colorTxs = this.store.get(this.colorTxsDBKey) || []

  var exists = this.get(data) !== null

  if (!exists) {
    colorTxs.push({
      colorId: data.colorId,
      txId: data.txId,
      outIndex: data.outIndex,
      value: data.value
    })

    this.store.set(this.colorTxsDBKey, colorTxs)
  }

  return !exists
}

/**
 * Get data from store or null if not found
 *
 * @param {Object} data
 * @param {number} data.colorId
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @return {Object|null}
 */
ColorDataStorage.prototype.get = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isNumber(data.colorId), 'Expected number data.colorId, got ' + data.colorId)
  assert(Transaction.isTxId(data.txId), 'Expected transaction id data.txId, got ' + data.txId)
  assert(_.isNumber(data.outIndex), 'Expected number data.outIndex, got ' + data.outIndex)

  var result = null
  var colorTxs = this.store.get(this.colorTxsDBKey) || []

  colorTxs.some(function(record) {
    if (record.colorId === data.colorId && record.txId === data.txId && record.outIndex === data.outIndex) {
      result = record
      return true
    }

    return false
  })

  return result
}

/**
 * Remove all colorTxs
 */
ColorDataStorage.prototype.clear = function() {
  this.store.remove(this.colorTxsDBKey)
}


module.exports = ColorDataStorage
