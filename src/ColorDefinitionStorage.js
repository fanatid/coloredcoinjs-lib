var inherits = require('util').inherits

var _ = require('lodash')

var SyncStorage = require('./SyncStorage')
var verify = require('./verify')


/**
 * @typedef {Object} ColorDefinitionRecord
 * @property {number} id
 * @property {string} descs
 */

/**
 * @class ColorDefinitionStorage
 * @extends SyncStorage
 */
function ColorDefinitionStorage() {
  SyncStorage.apply(this, Array.prototype.slice.call(arguments))

  this.colorDefinitionsDBKey = this.globalPrefix + 'ColorDefinitions'

  if (!_.isArray(this.store.get(this.colorDefinitionsDBKey)))
    this.store.set(this.colorDefinitionsDBKey, [])
}

inherits(ColorDefinitionStorage, SyncStorage)

/**
 * @param {string} desc
 * @return {ColorDefinitionRecord}
 * @throws {Error} If desc aready uses
 */
ColorDefinitionStorage.prototype.add = function(desc) {
  verify.string(desc)

  var newColorId = 1
  var colorDefinitions = this.store.get(this.colorDefinitionsDBKey) || []

  colorDefinitions.forEach(function(record) {
    if (record.desc === desc)
      throw new Error('UniqueConstraint')

    if (record.colorId >= newColorId)
      newColorId = record.colorId + 1
  })

  var record = { colorId: newColorId, desc: desc }
  colorDefinitions.push(record)
  this.store.set(this.colorDefinitionsDBKey, colorDefinitions)

  return record
}

/**
 * Get record by colorId
 *
 * @param {number} colorId
 * @return {?ColorDefinitionRecord}
 */
ColorDefinitionStorage.prototype.getByColorId = function(colorId) {
  verify.number(colorId)

  var records = this.getAll().filter(function(record) {
    return record.colorId === colorId
  })

  if (records.length === 0)
    return null

  return records[0]
}

/**
 * Get record by desc
 *
 * @param {string} desc
 * @return {?ColorDefinitionRecord}
 */
ColorDefinitionStorage.prototype.getByDesc = function(desc) {
  verify.string(desc)

  var records = this.getAll().filter(function(record) {
    return record.desc === desc
  })

  if (records.length === 0)
    return null

  return records[0]
}

/**
 * @return {ColorDefinitionRecord[]}
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
