/* globals Promise:true */
var _ = require('lodash')
var Promise = require('bluebird')

var GenesisColorDefinition = require('./GenesisColorDefinition')
var UncoloredColorDefinition = require('./UncoloredColorDefinition')
var errors = require('./errors')

/**
 * @class ColorDefinitionManager
 * @param {IColorDefinitionStorage} storage
 */
function ColorDefinitionManager (storage) {
  this._storage = storage
}

ColorDefinitionManager._cd_classes = {}

/**
 * @return {UncoloredColorDefinition}
 */
ColorDefinitionManager.getUncolored = function () {
  return new UncoloredColorDefinition()
}

/**
 * @return {GenesisColorDefinition}
 */
ColorDefinitionManager.getGenesis = function () {
  return new GenesisColorDefinition()
}

/**
 * @param {string} code
 * @param {ColorDefinition} cls
 * @throws {ColorDefinitionAlreadyRegisteredError}
 */
ColorDefinitionManager.registerColorDefinition = function (code, cls) {
  if (!_.isUndefined(ColorDefinitionManager._cd_classes[code])) {
    var msg = code + ': ' + cls.name
    throw new errors.ColorDefinitionAlreadyRegisteredError(msg)
  }

  ColorDefinitionManager._cd_classes[code] = cls
}

/**
 * @param {string} code
 * @return {?function}
 */
ColorDefinitionManager.getColorDefenitionClsForCode = function (code) {
  return ColorDefinitionManager._cd_classes[code] || null
}

/**
 * @private
 * @param {IColorDefinitionStorage~Record} record
 * @return {?ColorDefinition}
 */
ColorDefinitionManager.prototype._record2ColorDefinition = function (record) {
  var code = record.desc.split(':')[0]
  var Cls = ColorDefinitionManager.getColorDefenitionClsForCode(code)

  try {
    return Cls.fromDesc(record.id, record.desc)
  } catch (err) {
    // try uncolored
    try {
      return UncoloredColorDefinition.fromDesc(record.id, record.desc)
    } catch (err) {}
  }

  return null
}

/**
 * Return ColorDefinition instance if desc in store.
 *  Otherwise if autoAdd is true creates new ColorDefinition, add to store
 *    and return it
 *
 * @param {string} desc
 * @param {Object} [opts]
 * @param {boolean} [opts.autoAdd=true]
 * @return {Promise.<?ColorDefinition>}
 */
ColorDefinitionManager.prototype.resolve = function (desc, opts) {
  var self = this
  return Promise.try(function () {
    var uncolored = ColorDefinitionManager.getUncolored()
    if (uncolored.getDesc() === desc) {
      return uncolored
    }

    var colordef = self._record2ColorDefinition({id: -1, desc: desc})
    if (colordef === null) {
      throw new errors.ColorDefinitionBadDescError(desc)
    }

    return self._storage.resolve(desc, opts)
      .then(function (record) {
        return record === null
          ? null
          : self._record2ColorDefinition(record)
      })
  })
}

/**
 * @param {Object} [opts]
 * @param {number} [opts.id]
 * @return {Promise.<(?ColorDefinition|ColorDefinition[])>}
 */
ColorDefinitionManager.prototype.get = function (opts) {
  var self = this
  var id = Object(opts).id
  if (id === undefined) {
    return self._storage.get()
      .then(function (records) {
        return records.map(function (record) {
          return self._record2ColorDefinition(record)
        })
      })
  }

  return self._storage.get({id: id})
    .then(function (record) {
      if (record !== null) {
        return self._record2ColorDefinition(record)
      }

      var uncolored = ColorDefinitionManager.getUncolored()
      if (uncolored.getColorId() === id) {
        return uncolored
      }

      return null
    })
}

module.exports = ColorDefinitionManager
