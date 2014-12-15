var _ = require('lodash')

var ColorDefinition = require('./ColorDefinition')
var GenesisColorDefinition = require('./GenesisColorDefinition')
var UncoloredColorDefinition = require('./UncoloredColorDefinition')
var errors = require('./errors')
var verify = require('./verify')


/**
 * @class ColorDefinitionManager
 * @param {ColorDefinitionStorage} storage
 */
function ColorDefinitionManager(storage) {
  verify.ColorDefinitionStorage(storage)

  this._storage = storage
}

/**
 * @param {ColorDefinitionRecord} record
 * @return {?ColorDefinition}
 */
ColorDefinitionManager.prototype._record2ColorDefinition = function (record) {
  var type = record.desc.split(':')[0]
  var ColorDefinitionCls = this.getColorDefenitionClsForType(type)

  try {
    return ColorDefinitionCls.fromDesc(record.colorId, record.desc)

  } catch (e) {
    // try uncolored
    try {
      return UncoloredColorDefinition.fromDesc(record.colorId, record.desc)

    } catch (e) {}

  }

  return null
}

/**
 * Get uncolored ColorDefinition
 *
 * @return {UncoloredColorDefinition}
 */
ColorDefinitionManager.prototype.getUncolored = function () {
  return new UncoloredColorDefinition()
}

/**
 * Get genesis ColorDefinition for issue coins
 *
 * @return {GenesisColorDefinition}
 */
ColorDefinitionManager.prototype.getGenesis = function () {
  return new GenesisColorDefinition()
}

/**
 * @param {string} type
 * @return {?function}
 */
ColorDefinitionManager.prototype.getColorDefenitionClsForType = function (type) {
  return ColorDefinition.getColorDefenitionClsForType(type)
}

/**
 * Get ColorDefinition from storage by colorId or return null if not exists
 *
 * @param {number} colorId
 * @return {?ColorDefinition}
 */
ColorDefinitionManager.prototype.getByColorId = function (colorId) {
  verify.number(colorId)

  var uncolored = this.getUncolored()
  if (uncolored.getColorId() === colorId) { return uncolored }

  var record = this._storage.getByColorId(colorId)
  if (record === null) { return null }

  return this._record2ColorDefinition(record)
}

/**
 * Return ColorDefinition instance if desc in store.
 *  Otherwise if autoAdd is true creates new ColorDefinition, add to store and return it
 *
 * @param {string} desc
 * @param {boolean} [autoAdd=true]
 * @return {?ColorDefinition}
 * @throws {ColorDefinitionBadDescriptionError}
 */
ColorDefinitionManager.prototype.resolveByDesc = function (desc, autoAdd) {
  if (_.isUndefined(autoAdd)) { autoAdd = true }

  verify.string(desc)
  verify.boolean(autoAdd)

  var uncolored = this.getUncolored()
  if (uncolored.getDesc() === desc) { return uncolored }

  var record = this._storage.getByDesc(desc)
  if (record !== null) { return this._record2ColorDefinition(record) }

  if (autoAdd === false) { return null }

  var colordef = this._record2ColorDefinition({colorId: -1, desc: desc})
  if (colordef === null) {
    throw new errors.ColorDefinitionBadDescriptionError(desc)
  }

  record = this._storage.add(desc)
  return this._record2ColorDefinition(record)
}

/**
 * Get all ColorDefinitions
 *
 * @return {ColorDefinition[]}
 */
ColorDefinitionManager.prototype.getAllColorDefinitions = function () {
  return this._storage.getAll().map(this._record2ColorDefinition.bind(this))
}


module.exports = ColorDefinitionManager
