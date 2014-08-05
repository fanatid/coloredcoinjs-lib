var assert = require('assert')

var _ = require('lodash')

var colordef = require('./colordef')
var store = require('./store')

/**
 * Convert record to ColorDefinition instance
 *
 * @param {Object} record
 * @param {number} record.colorId
 * @param {Object} record.meta
 * @param {string} record.scheme
 * @return {ColorDefinition}
 */
function record2ColorDefinition(record) {
  assert(_.isObject(record), 'Expected Object record, got ' + record)
  assert(_.isNumber(record.colorId), 'Expected number record.colorId, got ' + record.colorId)
  assert(_.isObject(record.meta), 'Expected Object record.meta, got ' + record.meta)
  assert(_.isString(record.scheme), 'Expected string record.scheme, got ' + record.scheme)

  var colorDefinition = null

  var engineClss = [colordef.EPOBCColorDefinition]
  engineClss.some(function(engineCls) {
    colorDefinition = engineCls.fromScheme({ colorId: record.colorId, meta: record.meta }, record.scheme)

    return (colorDefinition !== null)
  })

  return colorDefinition
}


/**
 * @class ColorDefinitionManager
 *
 * @param {store.ColorDefinitionStore} cdStore
 */
function ColorDefinitionManager(cdStore) {
  assert(cdStore instanceof store.ColorDefinitionStore, 'Expected ColorDefinitionStore cdStore, got ' + cdStore)

  this.cdStore = cdStore
}

/**
 * Get uncolored ColorDefinition
 *
 * @return {ColorDefinition}
 */
ColorDefinitionManager.prototype.getUncolored = function() {
  return new colordef.ColorDefinition({ colorId: 0 })
}

/**
 * Get ColorDefinition from store by colorId or return null if not exists.
 *
 * @param {Object} params
 * @param {number} params.colorId
 * @return {ColorDefinition|null}
 */
ColorDefinitionManager.prototype.getByColorId = function(params) {
  assert(_.isObject(params), 'Expected Object params, got ' + params)
  assert(_.isNumber(params.colorId), 'Expected number params.colorId, got ' + params.colorId)

  if (params.colorId === 0)
    return this.getUncolored()

  var result = null

  var record = this.cdStore.get({ colorId: params.colorId })
  if (record !== null)
    result = record2ColorDefinition(record)

  return result
}

/**
 * Return ColorDefinition instance if scheme in store.
 *  Otherwise if data.autoAdd is true creates new ColorDefinition, add to store and return it
 *
 * @param {Object} data
 * @param {string} data.scheme
 * @param {boolean} [data.autoAdd=true]
 * @return {ColorDefinition|null}
 */
ColorDefinitionManager.prototype.resolveByScheme = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isString(data.scheme), 'Expected string data.scheme, got ' + data.scheme)
  data.autoAdd = _.isUndefined(data.autoAdd) ? true : data.autoAdd
  assert(_.isBoolean(data.autoAdd), 'Expected boolean data.autoAdd, got ' + data.autoAdd)

  var record = this.cdStore.get({ scheme: data.scheme })

  if (record !== null)
    return record2ColorDefinition(record)

  if (data.autoAdd === false)
    return null

  var result = record2ColorDefinition({
    colorId: -2, // 0 for uncolored, -1 for genesis
    meta: {},
    scheme: data.scheme
  })
  assert(result !== null, 'Bad scheme = ' + data.scheme)

  record = this.cdStore.add({ meta: {}, scheme: data.scheme })
  return record2ColorDefinition(record)
}

/**
 * Update meta-information for given ColorDefinition or throw Error if record not found
 *
 * @param {ColorDefinition} colorDefinition
 */
ColorDefinitionManager.prototype.updateMeta = function(colorDefinition) {
  assert(colorDefinition instanceof colordef.ColorDefinition,
    'Expected ColorDefinition colorDefinition, got ' + colorDefinition)

  this.cdStore.updateMeta({ colorId: colorDefinition.getColorId(), meta: colorDefinition.getMeta() })
}

/**
 * Get all ColorDefinitions
 *
 * @return {Array}
 */
ColorDefinitionManager.prototype.getAllColorDefinitions = function() {
  return this.cdStore.getAll().map(record2ColorDefinition)
}

/* test-code */
ColorDefinitionManager.record2ColorDefinition = record2ColorDefinition
/* end-test-code */


module.exports = ColorDefinitionManager
