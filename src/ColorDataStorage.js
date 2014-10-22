var inherits = require('util').inherits

var _ = require('lodash')

var SyncStorage = require('./SyncStorage')
var verify = require('./verify')


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
 * Todo: throw if exists
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
  verify.object(data)
  verify.number(data.colorId)
  verify.txId(data.txId)
  verify.number(data.outIndex)
  verify.number(data.value)

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
 * @return {?Object}
 */
// Todo: describe return object
ColorDataStorage.prototype.get = function(data) {
  verify.object(data)
  verify.number(data.colorId)
  verify.txId(data.txId)
  verify.number(data.outIndex)

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
