/* globals Promise:true */
var inherits = require('util').inherits
var events = require('events')
var timers = require('timers')
var Promise = require('bluebird')

var GenesisColorDefinition = require('./genesis')
var UncoloredColorDefinition = require('./uncolored')
var errors = require('../errors')

/**
 * @event ColorDefinitionManager#new
 * @param {ColorDefinition} cdef
 */

/**
 * @class ColorDefinitionManager
 * @extends {events.EventEmitter}
 * @param {IColorDefinitionStorage} storage
 */
function ColorDefinitionManager (storage) {
  events.EventEmitter.call(this)

  this._storage = storage
  this._uncolored = new UncoloredColorDefinition()
}

inherits(ColorDefinitionManager, events.EventEmitter)

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
 * @param {IColorDefinition} cls
 * @throws {ColorDefinitionAlreadyRegisteredError}
 */
ColorDefinitionManager.registerColorDefinition = function (cls) {
  var clsColorCode = cls.getColorCode()

  if (ColorDefinitionManager._cd_classes[clsColorCode] !== undefined) {
    var msg = clsColorCode + ': ' + cls.name
    throw new errors.ColorDefinitionAlreadyRegisteredError(msg)
  }

  ColorDefinitionManager._cd_classes[clsColorCode] = cls
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
  } catch (err) {}

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
    if (desc === self._uncolored.getDesc()) {
      return new UncoloredColorDefinition()
    }

    var colordef = self._record2ColorDefinition({id: -1, desc: desc})
    if (colordef === null) {
      throw new errors.ColorDefinitionBadDescError(desc)
    }

    // add event new
    return self._storage.resolve(desc, opts)
      .then(function (data) {
        if (data.record === null) {
          return null
        }

        var cdef = self._record2ColorDefinition(data.record)
        if (data.new === true) {
          timers.setImmediate(function () {
            self.emit('new', cdef)
          })
        }

        return cdef
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

  if (id === self._uncolored.getColorId()) {
    return Promise.resolve(new UncoloredColorDefinition())
  }

  return self._storage.get({id: id})
    .then(function (record) {
      if (record !== null) {
        return self._record2ColorDefinition(record)
      }

      return null
    })
}

module.exports = ColorDefinitionManager
