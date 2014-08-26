var assert = require('assert')

var _ = require('lodash')

var EPOBCColorDefinition = require('./EPOBCColorDefinition')
var UncoloredColorDefinition = require('./UncoloredColorDefinition')
var ColorDefinitionStorage = require('./ColorDefinitionStorage')


/**
 * Convert record to ColorDefinition instance
 *
 * @param {ColorDefinitionRecord} record
 * @return {ColorDefinition}
 */
function record2ColorDefinition(record) {
  var colorDefinition = null

  var engineClss = [UncoloredColorDefinition, EPOBCColorDefinition]
  engineClss.some(function(engineCls) {
    try {
      colorDefinition = engineCls.fromScheme(record.colorId, record.scheme)
    } catch (e) {}

    return colorDefinition !== null
  })

  return colorDefinition
}


/**
 * @class ColorDefinitionManager
 *
 * @param {ColorDefinitionStorage} storage
 */
function ColorDefinitionManager(storage) {
  assert(storage instanceof ColorDefinitionStorage,
    'Expected storage instance of ColorDefinitionStorage, got ' + storage)

  this.storage = storage
}

/**
 * Get uncolored ColorDefinition
 *
 * @return {ColorDefinition}
 */
ColorDefinitionManager.prototype.getUncolored = function() {
  return new UncoloredColorDefinition()
}

/**
 * Get ColorDefinition from storage by colorId or return null if not exists
 *
 * @param {number} colorId
 * @return {?ColorDefinition}
 */
ColorDefinitionManager.prototype.getByColorId = function(colorId) {
  var uncolored = this.getUncolored()
  if (uncolored.getColorId() === colorId)
    return uncolored

  var record = this.storage.getByColorId(colorId)

  if (record !== null)
    return record2ColorDefinition(record)

  return null
}

/**
 * Return ColorDefinition instance if scheme in store.
 *  Otherwise if autoAdd is true creates new ColorDefinition, add to store and return it
 *
 * @param {string} scheme
 * @param {boolean} [autoAdd=true]
 * @return {?ColorDefinition}
 */
ColorDefinitionManager.prototype.resolveByScheme = function(scheme, autoAdd) {
  var uncolored = this.getUncolored()
  if (uncolored.getScheme() === scheme)
    return uncolored

  autoAdd = _.isUndefined(autoAdd) ? true : autoAdd

  var record = this.storage.getByScheme(scheme)

  if (record !== null)
    return record2ColorDefinition(record)

  if (autoAdd === false)
    return null

  var colordef = record2ColorDefinition({ colorId: -1, scheme: scheme })
  assert(colordef !== null, 'Bad sceme: ' + scheme)

  record = this.storage.add(scheme)
  return record2ColorDefinition(record)
}

/**
 * Get all ColorDefinitions
 *
 * @return {ColorDefinition[]}
 */
ColorDefinitionManager.prototype.getAllColorDefinitions = function() {
  return this.storage.getAll().map(record2ColorDefinition)
}


module.exports = ColorDefinitionManager
