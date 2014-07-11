var assert = require('assert')
var _ = require('underscore')
var inherits = require('inherits')


/**
 * @class MemoryDB
 */
function MemoryDB() {
  this._data = {}
}

MemoryDB.prototype.has = function(key) {
  return !_.isUndefined(this.get(key))
}

MemoryDB.prototype.set = function(key, value) {
  assert(!_.isUndefined(value), 'Expected not undefined value')

  this._data[JSON.stringify(key)] = value
}

MemoryDB.prototype.get = function(key, value) {
  var result = this._data[JSON.stringify(key)]
  return _.isUndefined(result) ? value : result
}


/**
 * @class UnknownTypeDBError
 *
 * Inherits Error
 */
function UnknownTypeDBError() {
  Error.apply(this, Array.prototype.slice.call(arguments))
}

inherits(UnknownTypeDBError, Error)


/**
 * @class DataStore
 *
 * @param {string} type DB type, now available only memory
 * @param {object} opts DB options
 */
function DataStore(type, opts) {
  opts = opts === undefined ? {} : opts

  assert(_.isString(type), 'Expected string type, got ' + type)
  assert(_.isObject(opts), 'Expected object type, got ' + opts)

  this.type = type

  if (type === 'memory') {
    this.db = new MemoryDB()

  } else {
    throw new UnknownTypeDBError('Expected type in ["memory"], got ' + type)

  }
}


/**
 * @class ColorDataStore
 *
 * Inherits DataStore
 *
 * @param {string} type DB type, now available only memory
 * @param {object} opts DB options
 */
function ColorDataStore() {
  DataStore.apply(this, Array.prototype.slice.call(arguments))
}

inherits(ColorDataStore, DataStore)

/**
 * Add data to storage
 *
 * @param {number} colorID
 * @param {string} txHash
 * @param {number} outIndex
 * @param {number} value
 * @param {function} cb Called on added with params (error)
 */
ColorDataStore.prototype.add = function(colorID, txHash, outIndex, value, cb) {
  assert(_.isNumber(colorID), 'Expected number colorID, got ' + colorID)
  assert(_.isString(txHash), 'Expected string txHash, got ' + txHash)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(_.isNumber(value), 'Expected number value, got ' + value)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (this.type === 'memory') {
    this.db.set([colorID, txHash, outIndex], value)
    process.nextTick(function() { cb(null) })
  }
}

/**
 * Add data to storage
 *
 * @param {number} colorID
 * @param {string} txHash
 * @param {number} outIndex
 * @param {function} cb Called on fetched with params (error, record|null)
 */
ColorDataStore.prototype.get = function(colorID, txHash, outIndex, cb) {
  assert(_.isNumber(colorID), 'Expected number colorID, got ' + colorID)
  assert(_.isString(txHash), 'Expected string txHash, got ' + txHash)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (this.type === 'memory') {
    var value = this.db.get([colorID, txHash, outIndex])

    if (_.isUndefined(value))
      process.nextTick(function() { cb(null, null) })
    else
      process.nextTick(function() { cb(null, [colorID, txHash, outIndex, value]) })
  }
}


module.exports = {
  /* test-code */
  MemoryDB: MemoryDB,
  UnknownTypeDBError: UnknownTypeDBError,
  /* end-test-code */

  DataStore: DataStore,
  ColorDataStore: ColorDataStore
}
