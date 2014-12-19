var inherits = require('util').inherits

var _ = require('lodash')

var SyncStorage = require('./SyncStorage')
var errors = require('./errors')
var verify = require('./verify')


/**
 * @typedef {Object} ColorDefinitionStorage~Record
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

  if (_.isUndefined(this.store.get(this.colorDefinitionsDBKey + '_version'))) {
    this.store.set(this.colorDefinitionsDBKey + '_version', '1')
  }

  if (this.store.get(this.colorDefinitionsDBKey + '_version') === '1') {
    this.store.set(this.colorDefinitionsDBKey + '_version', 2)
  }
}

inherits(ColorDefinitionStorage, SyncStorage)

/**
 * @private
 * @return {ColorDefinitionStorage~Record[]}
 */
ColorDefinitionStorage.prototype._getRecords = function () {
  return this.colorDefinitionsRecords
}

/**
 * @private
 * @param {ColorDefinitionStorage~Record[]} records
 */
ColorDefinitionStorage.prototype._saveRecords = function (records) {
  this.colorDefinitionsRecords = records
  this.store.set(this.colorDefinitionsDBKey, records)
}

/**
 * @param {string} desc
 * @return {ColorDefinitionStorage~Record}
 * @throws {UniqueConstraintError} If desc aready uses
 */
ColorDefinitionStorage.prototype.add = function (desc) {
  verify.string(desc)

  var newColorId = 1
  var records = this._getRecords()

  records.forEach(function (record) {
    if (record.desc === desc) {
      throw new errors.UniqueConstraintError('ColorDefinitionStorage: ' + desc)
    }

    if (record.colorId >= newColorId) {
      newColorId = record.colorId + 1
    }
  })

  records.push({colorId: newColorId, desc: desc})
  this._saveRecords(records)

  return _.clone(_.last(records))
}

/**
 * @param {number} colorId
 * @return {?ColorDefinitionStorage~Record}
 */
ColorDefinitionStorage.prototype.getByColorId = function (colorId) {
  verify.number(colorId)

  var record = _.find(this._getRecords(), {colorId: colorId})
  return _.isUndefined(record) ? null : _.clone(record)
}

/**
 * @param {string} desc
 * @return {?ColorDefinitionStorage~Record}
 */
ColorDefinitionStorage.prototype.getByDesc = function (desc) {
  verify.string(desc)

  var record = _.find(this._getRecords(), {desc: desc})

  return _.isUndefined(record) ? null : _.clone(record)
}

/**
 * @return {ColorDefinitionStorage~Record[]}
 */
ColorDefinitionStorage.prototype.getAll = function () {
  return _.cloneDeep(this._getRecords())
}

/**
 * Remove all color definitions from store
 */
ColorDefinitionStorage.prototype.clear = function () {
  this.store.remove(this.colorDefinitionsDBKey)
  this.store.remove(this.colorDefinitionsDBKey + '_version')
}


module.exports = ColorDefinitionStorage
