var assert = require('assert')
var _ = require('underscore')
var inherits = require('util').inherits

var Transaction = require('./transaction')


/**
 * @class MemoryDB
 */
function MemoryDB() {
  this.data = []
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
 * @class UniqueConstraintError
 *
 * Inherits Error
 */
function UniqueConstraintError() {
  Error.apply(this, Array.prototype.slice.call(arguments))
}

inherits(UniqueConstraintError, Error)


/**
 * @class DataStore
 *
 * @param {string} type DB type, now available only memory
 * @param {object} opts DB options
 */
function DataStore(type, opts) {
  opts = _.isUndefined(opts) ? {} : opts

  assert(_.isString(type), 'Expected string type, got ' + type)
  assert(_.isObject(opts), 'Expected object type, got ' + opts)

  this.dbType = type

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

  if (this.dbType === 'memory') {
    var error = null

    this.db.data.some(function(record) {
      if (record[0] === colorId && record[1] === txId && record[2] === outIndex) {
        error = new UniqueConstraintError()
        return true
      }

      return false
    })

    if (error === null)
      this.db.data.push([colorId, txId, outIndex, value])

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

  if (this.dbType === 'memory') {
    var result = null

    this.db.data.some(function(record) {
      if (record[0] === colorId && record[1] === txId && record[2] === outIndex) {
        result = {
          colorId: record[0],
          txId: record[1],
          outIndex: record[2],
          value: record[3]
        }
        return true
      }

      return false
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

  if (this.dbType === 'memory') {
    var records = []

    this.db.data.forEach(function(record) {
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


/**
 * @class ColorDefinitionStore
 *
 * Inherits DataStore
 *
 * @param {string} type DB type, now available only memory
 * @param {object} opts DB options
 */
function ColorDefinitionStore() {
  DataStore.apply(this, Array.prototype.slice.call(arguments))
}

inherits(ColorDefinitionStore, DataStore)

/**
 * Get ColorDefinition by colorDesc or
 *  add in storage if not exists and autoAdd is true
 *
 * @param {string} colorDesc
 * @param {boolean} autoAdd
 * @param {function} cb Called on finished with params (error, number)
 */
ColorDefinitionStore.prototype.resolveColorDesc = function(colorDesc, autoAdd, cb) {
  assert(_.isString(colorDesc), 'Expected string colorDesc, got ' + colorDesc)
  assert(_.isBoolean(autoAdd), 'Expected boolean autoAdd, got ' + autoAdd)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  // Todo: add colorDesc validator

  if (this.dbType === 'memory') {
    var exists = this.db.data.some(function(record) {
      if (record[1] === colorDesc) {
        process.nextTick(function() { cb(null, record[0]) })
        return true
      }

      return false
    })

    if (!exists && autoAdd) {
      var maxColorId = 0

      this.db.data.forEach(function(record) {
        if (record[0] > maxColorId)
          maxColorId = record[0]
      })

      var newColorId = maxColorId + 1
      this.db.data.push([newColorId, colorDesc])
      process.nextTick(function() { cb(null, newColorId) })

    } else if (!exists) {
      process.nextTick(function() { cb(null, null) })
    }
  }
}

/**
 * Return colorDesc by colorId
 *
 * @param {number} colorId
 * @param {function} cb Called on finished with params (error, string)
 */
ColorDefinitionStore.prototype.findColorDesc = function(colorId, cb) {
  assert(_.isNumber(colorId), 'Expected number colorId, got ' + colorId)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (this.dbType === 'memory') {
    var result = null

    this.db.data.some(function(record) {
      if (record[0] === colorId) {
        result = record[1]
        return true
      }

      return false
    })

    process.nextTick(function() { cb(null, result) })
  }
}


module.exports = {
  /* test-code */
  MemoryDB: MemoryDB,
  UnknownTypeDBError: UnknownTypeDBError,
  UniqueConstraintError: UniqueConstraintError,
  /* end-test-code */

  DataStore: DataStore,
  ColorDataStore: ColorDataStore,
  ColorDefinitionStore: ColorDefinitionStore
}
