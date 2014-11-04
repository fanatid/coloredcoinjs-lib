var inherits = require('util').inherits

var _ = require('lodash')

var SyncStorage = require('./SyncStorage')
var verify = require('./verify')


/**
 * @typedef {Object} ColorDefinitionRecord
 * @property {number} id
 * @property {string} desc
 */

/**
 * @class ColorDefinitionStorage
 * @extends SyncStorage
 */
function ColorDefinitionStorage() {
  SyncStorage.apply(this, Array.prototype.slice.call(arguments))

  this.colorDefinitionsDBKey = this.globalPrefix + 'ColorDefinitions'
  this.colorDefinitionsRecords = this.store.get(this.colorDefinitionsDBKey) || []

  if (_.isUndefined(this.store.get(this.colorDefinitionsDBKey + '_version')))
    this.store.set(this.colorDefinitionsDBKey + '_version', '1')
}

inherits(ColorDefinitionStorage, SyncStorage)

/**
 * @return {ColorDefinitionRecord[]}
 */
ColorDefinitionStorage.prototype._getRecords = function() {
  return this.colorDefinitionsRecords
}

/**
 * @param {ColorDefinitionRecord[]}
 */
ColorDefinitionStorage.prototype._saveRecords = function(records) {
  this.colorDefinitionsRecords = records
  this.store.set(this.colorDefinitionsDBKey, records)
}

/**
 * @param {string} desc
 * @return {ColorDefinitionRecord}
 * @throws {Error} If desc aready uses
 */
ColorDefinitionStorage.prototype.add = function(desc) {
  verify.string(desc)

  var newColorId = 1
  var records = this._getRecords()

  records.forEach(function(record) {
    if (record.desc === desc)
      throw new Error('UniqueConstraint')

    if (record.colorId >= newColorId)
      newColorId = record.colorId + 1
  })

  records.push({ colorId: newColorId, desc: desc })
  this._saveRecords(records)

  return _.clone(_.last(records))
}

/**
 * @param {number} colorId
 * @return {?ColorDefinitionRecord}
 */
ColorDefinitionStorage.prototype.getByColorId = function(colorId) {
  verify.number(colorId)

  var record = _.find(this._getRecords(), function(record) {
    return record.colorId === colorId
  })

  return _.isUndefined(record) ? null : _.clone(record)
}

/**
 * @param {string} desc
 * @return {?ColorDefinitionRecord}
 */
ColorDefinitionStorage.prototype.getByDesc = function(desc) {
  verify.string(desc)

  var record = _.find(this._getRecords(), function(record) {
    return record.desc === desc
  })

  return _.isUndefined(record) ? null : _.clone(record)
}

/**
 * @return {ColorDefinitionRecord[]}
 */
ColorDefinitionStorage.prototype.getAll = function() {
  return _.cloneDeep(this._getRecords())
}

/**
 * Remove all ColorDefinitions
 */
ColorDefinitionStorage.prototype.clear = function() {
  this.store.remove(this.colorDefinitionsDBKey)
}


module.exports = ColorDefinitionStorage
