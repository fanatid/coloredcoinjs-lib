var assert = require('assert')

var _ = require('lodash')

var GenesisColorDefinition = require('./GenesisColorDefinition')
var UncoloredColorDefinition = require('./UncoloredColorDefinition')
var EPOBCColorDefinition = require('./EPOBCColorDefinition')


/**
 * Convert record to ColorDefinition
 *
 * @param {ColorDefinitionRecord} record
 * @return {ColorDefinition}
 */
function record2ColorDefinition(record) {
  var colorDefinition = null

  var engineClss = [UncoloredColorDefinition, EPOBCColorDefinition]
  engineClss.some(function(engineCls) {
    try {
      colorDefinition = engineCls.fromDesc(record.colorId, record.desc)
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
  this.storage = storage
}

/**
 * Get uncolored ColorDefinition
 *
 * @return {UncoloredColorDefinition}
 */
ColorDefinitionManager.prototype.getUncolored = function() {
  return new UncoloredColorDefinition()
}

/**
 * Get genesis ColorDefinition for issue coins
 *
 * @return {GenesisColorDefinition}
 */
ColorDefinitionManager.prototype.getGenesis = function() {
  return new GenesisColorDefinition()
}

/**
 * @param {string} type
 * @return {?(EPOBCColorDefinition)}
 */
ColorDefinitionManager.prototype.getColorDefenitionClsForType = function(type) {
  switch (type) {
    case 'epobc':
      return EPOBCColorDefinition

    default:
      return null
  }
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
 * Return ColorDefinition instance if desc in store.
 *  Otherwise if autoAdd is true creates new ColorDefinition, add to store and return it
 *
 * @param {string} desc
 * @param {boolean} [autoAdd=true]
 * @return {?ColorDefinition}
 */
ColorDefinitionManager.prototype.resolveByDesc = function(desc, autoAdd) {
  var uncolored = this.getUncolored()
  if (uncolored.getDesc() === desc)
    return uncolored

  if (_.isUndefined(autoAdd))
    autoAdd = true

  var record = this.storage.getByDesc(desc)
  if (record !== null)
    return record2ColorDefinition(record)

  if (autoAdd === false)
    return null

  var colordef = record2ColorDefinition({ colorId: -1, desc: desc })
  assert(colordef !== null, 'Bad desc: ' + desc)

  record = this.storage.add(desc)
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
