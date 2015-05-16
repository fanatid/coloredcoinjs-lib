/* globals Promise:true */
var inherits = require('util').inherits
var timers = require('timers')
var Promise = require('bluebird')

var IColorDefinitionStorage = require('./interface')

/**
 * @class AbstractSyncColorDefinitionStorage
 * @extends IColorDefinitionStorage
 *
 * @param {Object} provider
 */
function AbstractSyncColorDefinitionStorage (provider) {
  var self = this

  self._provider = provider
  IColorDefinitionStorage.call(self)

  timers.setImmediate(function () {
    self._provider.open()
      .then(function () { self._ready() },
            function (err) { self._ready(err) })
  })
}

inherits(AbstractSyncColorDefinitionStorage, IColorDefinitionStorage)

/**
 * @return {boolean}
 */
AbstractSyncColorDefinitionStorage.isAvailable = function () { return false }

/**
 * @param {string} desc
 * @param {boolean} [autoAdd=true]
 * @return {Promise.<?IColorDefinitionStorage~Record>}
 */
AbstractSyncColorDefinitionStorage.prototype.resolve =
function (desc, autoAdd) {
  var storage = this._provider
  return storage.transaction(function () {
    return storage.get(desc)
      .then(function (colorId) {
        // exists?
        colorId = parseInt(colorId, 10)
        if (!isNaN(colorId)) {
          return {id: colorId, desc: desc}
        }

        // autoAdd = false
        if (!autoAdd && autoAdd !== undefined) {
          return null
        }

        // get prev color id
        return storage.get('~counter')
          .then(function (colorId) {
            // counter exists and ok, return
            colorId = parseInt(colorId, 10)
            if (!isNaN(colorId)) {
              return colorId + 1
            }

            // try get max color id or set to zero
            colorId = 0
            return storage.iterate(function (key, value) {
              value = parseInt(value, 10)
              colorId = Math.max(colorId, value)
            })
            .then(function () { return colorId + 1 })
          })
          .then(function (newColorId) {
            // update counter and save desc with new color id
            return Promise.all([
              storage.set('~counter', newColorId),
              storage.set(desc, newColorId)
            ])
            .then(function () {
              return {id: newColorId, desc: desc}
            })
          })
      })
  })
}

/**
 * @param {number} [id]
 * @return {Promise.<(
 *   ?IColorDefinitionStorage~Record|
 *   IColorDefinitionStorage~Record[]
 * )>}
 */
AbstractSyncColorDefinitionStorage.prototype.get = function (id) {
  var storage = this._provider
  return storage.transaction(function () {
    if (id !== undefined) {
      var record = null
      return storage.iterate(function (key, value) {
        value = parseInt(value, 10)
        if (value === id) {
          record = {id: id, desc: key}
        }
      })
      .then(function () { return record })
    }

    var records = []
    return storage.iterate(function (key, value) {
      value = parseInt(value, 10)
      if (key !== '~counter' && !isNaN(value)) {
        records.push({id: value, desc: key})
      }
    })
    .then(function () { return records })
  })
}

/**
 * @return {Promise}
 */
AbstractSyncColorDefinitionStorage.prototype.clear = function () {
  var storage = this._provider
  return storage.transaction(function () {
    return storage.clear()
  })
}

/**
 * @return {string}
 */
AbstractSyncColorDefinitionStorage.prototype.inspect = function () {
  return '<storage.definitions.AbstractSyncColorDefinitionStorage>'
}

module.exports = AbstractSyncColorDefinitionStorage
