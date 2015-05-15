/* globals Promise:true */
var inherits = require('util').inherits
var Promise = require('bluebird')

var AbstractColorDefinitionStorage = require('./abstract')

/**
 * @class AbstractSyncColorDefinitionStorage
 * @extends AbstractColorDefinitionStorage
 *
 * @param {Object} storage
 */
function AbstractSyncColorDefinitionStorage (storage) {
  if (!(this instanceof AbstractSyncColorDefinitionStorage)) {
    return new AbstractSyncColorDefinitionStorage(storage)
  }

  this._storage = storage
  AbstractColorDefinitionStorage.call(this)

  this._ready()
}

inherits(AbstractSyncColorDefinitionStorage, AbstractColorDefinitionStorage)

/**
 * @param {string} desc
 * @param {boolean} [autoAdd=true]
 * @return {Promise.<?AbstractColorDefinitionStorage~Record>}
 */
AbstractSyncColorDefinitionStorage.prototype.resolve =
function (desc, autoAdd) {
  var self = this
  return Promise.try(function () {
    var colorId = parseInt(self._storage.get(desc), 10)
    if (isNaN(colorId)) {
      if (!autoAdd && autoAdd !== undefined) {
        return null
      }

      colorId = self._storage.get('~counter')
      if (colorId !== null) {
        colorId = parseInt(colorId, 10)
        if (isNaN(colorId)) {
          colorId = 0
          self._storage.iterate(function (key, value) {
            value = parseInt(value, 10)
            colorId = Math.max(colorId, value)
          })
        }
      } else {
        colorId = 0
      }

      colorId += 1
      self._storage.set('~counter', colorId)
      self._storage.set(desc, colorId)
    }

    return {id: colorId, desc: desc}
  })
}

/**
 * @param {number} [id]
 * @return {Promise.<(
 *   ?AbstractColorDefinitionStorage~Record|
 *   AbstractColorDefinitionStorage~Record[]
 * )>}
 */
AbstractSyncColorDefinitionStorage.prototype.get = function (id) {
  var self = this
  return Promise.try(function () {
    if (id !== undefined) {
      var record = null
      self._storage.iterate(function (key, value) {
        value = parseInt(value, 10)
        if (value === id) {
          record = {id: id, desc: key}
        }
      })
      return record
    }

    var records = []
    self._storage.iterate(function (key, value) {
      value = parseInt(value, 10)
      if (key !== '~counter' && !isNaN(value)) {
        records.push({id: value, desc: key})
      }
    })
    return records
  })
}

/**
 * @return {Promise}
 */
AbstractSyncColorDefinitionStorage.prototype.clear = function () {
  var self = this
  return Promise.try(function () {
    self._storage.clear()
  })
}

module.exports = AbstractSyncColorDefinitionStorage
