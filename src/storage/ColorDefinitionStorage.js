var assert = require('assert')
var inherits = require('util').inherits

var _ = require('lodash')

var SyncStorage = require('./SyncStorage')


/**
 * @class ColorDefinitionStorage
 *
 * Inherits SyncStorage
 */
function ColorDefinitionStorage() {
  SyncStorage.apply(this, Array.prototype.slice.call(arguments))

  this.colorDefinitionsDBKey = this.globalPrefix + 'ColorDefinitions'

  if (!_.isArray(this.store.get(this.colorDefinitionsDBKey)))
    this.store.set(this.colorDefinitionsDBKey, [])
}

inherits(ColorDefinitionStorage, SyncStorage)

/**
 * @param {Object} data
 * @param {Object} data.meta
 * @param {string} data.scheme
 * @return {Object}
 */
ColorDefinitionStorage.prototype.add = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isObject(data.meta), 'Expected Object data.meta, got ' + data.meta)
  assert(_.isString(data.scheme), 'Expected string data.scheme, got ' + data.scheme)

  var maxColorId = 0
  var colorDefinitions = this.store.get(this.colorDefinitionsDBKey) || []

  colorDefinitions.forEach(function(record) {
    if (record.scheme === data.scheme)
      throw new Error('UniqueConstraint')

    if (record.colorId > maxColorId)
      maxColorId = record.colorId
  })

  var result = {
    colorId: maxColorId + 1,
    meta: data.meta,
    scheme: data.scheme
  }
  colorDefinitions.push(result)

  this.store.set(this.colorDefinitionsDBKey, colorDefinitions)

  return result
}

/**
 * @param {Object} data
 * @param {number} [data.colorId]
 * @param {string} [data.scheme]
 * @return {Object|null}
 */
ColorDefinitionStorage.prototype.get = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  if (_.isUndefined(data.colorId))
    assert(_.isString(data.scheme), 'Expected string data.scheme, got ' + data.scheme)
  else
    assert(_.isNumber(data.colorId), 'Expected number data.colorId, got ' + data.colorId)

  var result = null
  var records = this.store.get(this.colorDefinitionsDBKey) || []

  records.some(function(record) {
    if ( record.colorId === data.colorId || record.scheme === data.scheme) {
      result = record
      return true
    }

    return false
  })

  return result
}

/**
 * @param {Object} data
 * @param {number} data.colorId
 * @param {Object} data.meta
 */
ColorDefinitionStorage.prototype.updateMeta = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isNumber(data.colorId), 'Expected number data.colorId, got ' + data.colorId)
  assert(_.isObject(data.meta), 'Expected Object data.meta, got ' + data.meta)

  var records = this.store.get(this.colorDefinitionsDBKey) || []

  records.forEach(function(record) {
    if (record.colorId === data.colorId)
      record.meta = data.meta
  })

  this.store.set(this.colorDefinitionsDBKey, records)
}

/**
 * @return {Array}
 */
ColorDefinitionStorage.prototype.getAll = function() {
  var colorDefinitions = this.store.get(this.colorDefinitionsDBKey) || []

  return colorDefinitions
}

/**
 * Remove all ColorDefinitions
 */
ColorDefinitionStorage.prototype.clear = function() {
  this.store.remove(this.colorDefinitionsDBKey)
}

module.exports = ColorDefinitionStorage
