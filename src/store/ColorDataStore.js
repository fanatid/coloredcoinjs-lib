var assert = require('assert')
var inherits = require('util').inherits

var _ = require('lodash')

var DataStore = require('./DataStore')
var Transaction = require('../Transaction')


/**
 * @class ColorDataStore
 *
 * Inherits DataStore
 */
function ColorDataStore() {
  DataStore.apply(this, Array.prototype.slice.call(arguments))

  this.colorTxsDBKey = DataStore.globalPrefix + 'colorTxs'
  /* test-code */
  this.colorTxsDBKey = this.colorTxsDBKey + '_tests'
  /* end-test-code */

  if (!_.isArray(this.store.get(this.colorTxsDBKey)))
    this.store.set(this.colorTxsDBKey, [])
}

inherits(ColorDataStore, DataStore)

/**
 * Add colorId txOutput to store
 *
 * @param {Object} data
 * @param {number} data.colorId
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @param {number} data.value
 */
ColorDataStore.prototype.add = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isNumber(data.colorId), 'Expected number data.colorId, got ' + data.colorId)
  assert(Transaction.isTxId(data.txId), 'Expected transaction id data.txId, got ' + data.txId)
  assert(_.isNumber(data.outIndex), 'Expected number data.outIndex, got ' + data.outIndex)
  assert(_.isNumber(data.value), 'Expected number data.value, got ' + data.value)

  var colorTxs = this.store.get(this.colorTxsDBKey) || []

  colorTxs.forEach(function(record) {
    if (record.colorId === data.colorId && record.txId === data.txId && record.outIndex === data.outIndex)
      throw new Error('UniqueConstraint')
  })

  colorTxs.push({
    colorId: data.colorId,
    txId: data.txId,
    outIndex: data.outIndex,
    value: data.value
  })

  this.store.set(this.colorTxsDBKey, colorTxs)
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
ColorDataStore.prototype.get = function(data) {
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
ColorDataStore.prototype.clear = function() {
  this.store.remove(this.colorTxsDBKey)
}


module.exports = ColorDataStore
