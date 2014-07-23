var assert = require('assert')
var _ = require('underscore')
var inherits = require('util').inherits

var DataStore = require('./DataStore')


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
