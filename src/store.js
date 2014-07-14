var assert = require('assert')
var _ = require('underscore')
var inherits = require('inherits')


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
  opts = opts === undefined ? {} : opts

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

  if (this.dbType === 'memory') {
    var error = null

    this.db.data.some(function(record) {
      if (record[0] === colorID && record[1] === txHash && record[2] === outIndex) {
        error = new UniqueConstraintError()
        return true
      }

      return false
    })

    if (error === null)
      this.db.data.push([colorID, txHash, outIndex, value])

    process.nextTick(function() { cb(error) })
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

  if (this.dbType === 'memory') {
    var result = null

    this.db.data.some(function(record) {
      if (record[0] === colorID && record[1] === txHash && record[2] === outIndex) {
        result = {
          colorID: record[0],
          txHash: record[1],
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
 * Get all records for a given txHash and outIndex
 *
 * @param {string} txHash
 * @param {number} outIndex
 * @param {function} cb Called on fetched with params (error, record|null)
 */
ColorDataStore.prototype.getAny = function(txHash, outIndex, cb) {
  assert(_.isString(txHash), 'Expected string txHash, got ' + txHash)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (this.dbType === 'memory') {
    var records = []

    this.db.data.forEach(function(record) {
      if (record[1] === txHash && record[2] === outIndex)
        records.push({
          colorID: record[0],
          txHash: record[1],
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
      var maxColorID = 0

      this.db.data.forEach(function(record) {
        if (record[0] > maxColorID)
          maxColorID = record[0]
      })

      var newColorID = maxColorID + 1
      this.db.data.push([newColorID, colorDesc])
      process.nextTick(function() { cb(null, newColorID) })

    } else if (!exists) {
      process.nextTick(function() { cb(null, null) })
    }
  }
}

/**
 * Return colorDesc by colorID
 *
 * @param {number} colorID
 * @param {function} cb Called on finished with params (error, string)
 */
ColorDefinitionStore.prototype.findColorDesc = function(colorID, cb) {
  assert(_.isNumber(colorID), 'Expected number colorID, got ' + colorID)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (this.dbType === 'memory') {
    var result = null

    this.db.data.some(function(record) {
      if (record[0] === colorID) {
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
