var _ = require('lodash')

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

ColorDefinitionManager._colorDefinitionClasses = {}

/**
 * @return {UncoloredColorDefinition}
 */
ColorDefinitionManager.getUncolored = function () {
  return new UncoloredColorDefinition()
}

/**
 * @{link ColorDefinitionManager.getUncolored}
 */
ColorDefinitionManager.prototype.getUncolored = function () {
  console.warn('Instance method deprecated for removal in 1.0.0, use static ColorDefinitionManager.getUncolored')
  return ColorDefinitionManager.getUncolored()
}

/**
 * @return {GenesisColorDefinition}
 */
ColorDefinitionManager.getGenesis = function () {
  return new GenesisColorDefinition()
}

/**
 * @{link ColorDefinitionManager.getGenesis}
 */
ColorDefinitionManager.prototype.getGenesis = function () {
  console.warn('Instance method deprecated for removal in 1.0.0, use static ColorDefinitionManager.getGenesis')
  return ColorDefinitionManager.getGenesis()
}

/**
 * @param {string} type
 * @param {ColorDefinition} cls
 * @throws {ColorDefinitionAlreadyRegisteredError}
 */
ColorDefinitionManager.registerColorDefinition = function (type, cls) {
  verify.string(type)
  verify.function(cls)

  if (!_.isUndefined(ColorDefinitionManager._colorDefinitionClasses[type])) {
    throw new errors.ColorDefinitionAlreadyRegisteredError(type + ': ' + cls.name)
  }

  ColorDefinitionManager._colorDefinitionClasses[type] = cls
}

/**
 * @param {string} type
 * @return {?function}
 */
ColorDefinitionManager.getColorDefenitionClsForType = function (type) {
  verify.string(type)

  return ColorDefinitionManager._colorDefinitionClasses[type] || null
}

/**
 * @{link ColorDefinitionManager.getColorDefenitionClsForType}
 */
ColorDefinitionManager.prototype.getColorDefenitionClsForType = function (type) {
  console.warn(
    'Instance method deprecated for removal in 1.0.0, use static ColorDefinitionManager.getColorDefenitionClsForType')
  return ColorDefinitionManager.getColorDefenitionClsForType(type)
}

/**
 * @private
 * @param {ColorDefinitionRecord} record
 * @return {?ColorDefinition}
 */
ColorDefinitionManager.prototype._record2ColorDefinition = function (record) {
  var type = record.desc.split(':')[0]
  var ColorDefinitionCls = ColorDefinitionManager.getColorDefenitionClsForType(type)

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
 * Get ColorDefinition from storage by colorId or return null if not exists
 *
 * @param {number} colorId
 * @return {?ColorDefinition}
 */
ColorDefinitionManager.prototype.getByColorId = function (colorId) {
  verify.number(colorId)

  var uncolored = ColorDefinitionManager.getUncolored()
  if (uncolored.getColorId() === colorId) {
    return uncolored
  }

  var record = this._storage.getByColorId(colorId)
  if (record === null) {
    return null
  }

  return this._record2ColorDefinition(record)
}

/**
 * Return ColorDefinition instance if desc in store.
 *  Otherwise if autoAdd is true creates new ColorDefinition, add to store and return it
 *
 * @param {string} desc
 * @param {boolean} [autoAdd=true]
 * @return {?ColorDefinition}
 * @throws {ColorDefinitionBadDescError}
 */
ColorDefinitionManager.prototype.resolveByDesc = function (desc, autoAdd) {
  verify.string(desc)
  if (_.isUndefined(autoAdd)) { autoAdd = true }
  verify.boolean(autoAdd)

  var uncolored = ColorDefinitionManager.getUncolored()
  if (uncolored.getDesc() === desc) {
    return uncolored
  }

  var record = this._storage.getByDesc(desc)
  if (record !== null) {
    return this._record2ColorDefinition(record)
  }

  if (autoAdd === false) {
    return null
  }

  var colordef = this._record2ColorDefinition({colorId: -1, desc: desc})
  if (colordef === null) {
    throw new errors.ColorDefinitionBadDescError(desc)
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
