var assert = require('assert')
var _ = require('underscore')
var inherits = require('util').inherits

var errors = require('./errors')
var DataStore = require('./DataStore')

var Transaction = require('../Transaction')


/**
 * @class ColorDataStore
 *
 * Inherits DataStore
 *
 * @param {string} type DB type
 * @param {Object} opts DB options
 */
function ColorDataStore() {
  DataStore.apply(this, Array.prototype.slice.call(arguments))

  if (!_.isArray(this._db.data))
    this._db.data = []
}

inherits(ColorDataStore, DataStore)

/**
 * Add data to storage
 *
 * @param {number} colorId
 * @param {string} txId
 * @param {number} outIndex
 * @param {number} value
 * @param {function} cb Called on added with params (error)
 */
ColorDataStore.prototype.add = function(colorId, txId, outIndex, value, cb) {
  assert(_.isNumber(colorId), 'Expected number colorId, got ' + colorId)
  assert(Transaction.isTxId(txId), 'Expected transaction id txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(_.isNumber(value), 'Expected number value, got ' + value)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (this._dbType === 'memory') {
    var error = null

    this._db.data.every(function(record) {
      if (record[0] === colorId && record[1] === txId && record[2] === outIndex) {
        error = new errors.UniqueConstraintError()
        return false
      }

      return true
    })

    if (error === null)
      this._db.data.push([colorId, txId, outIndex, value])

    process.nextTick(function() { cb(error) })
  }
}

/**
 * Add data to storage
 *
 * @param {number} colorId
 * @param {string} txId
 * @param {number} outIndex
 * @param {function} cb Called on fetched with params (error, record|null)
 */
ColorDataStore.prototype.get = function(colorId, txId, outIndex, cb) {
  assert(_.isNumber(colorId), 'Expected number colorId, got ' + colorId)
  assert(Transaction.isTxId(txId), 'Expected transaction id txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (this._dbType === 'memory') {
    var result = null

    this._db.data.every(function(record) {
      if (record[0] === colorId && record[1] === txId && record[2] === outIndex) {
        result = {
          colorId: record[0],
          txId: record[1],
          outIndex: record[2],
          value: record[3]
        }
        return false
      }

      return true
    })

    process.nextTick(function() { cb(null, result) } )
  }
}

/**
 * Get all records for a given txId and outIndex
 *
 * @param {string} txId
 * @param {number} outIndex
 * @param {function} cb Called on fetched with params (error, record|null)
 */
ColorDataStore.prototype.getAny = function(txId, outIndex, cb) {
  assert(Transaction.isTxId(txId), 'Expected transaction id txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (this._dbType === 'memory') {
    var records = []

    this._db.data.forEach(function(record) {
      if (record[1] === txId && record[2] === outIndex)
        records.push({
          colorId: record[0],
          txId: record[1],
          outIndex: record[2],
          value: record[3]
        })
    })

    process.nextTick(function() { cb(null, records) })
  }
}


module.exports = ColorDataStore
