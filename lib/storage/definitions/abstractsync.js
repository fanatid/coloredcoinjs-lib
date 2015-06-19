'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')

var IColorDefinitionStorage = require('./interface')

/**
 * @class AbstractSyncColorDefinitionStorage
 * @extends IColorDefinitionStorage
 */
function AbstractSyncColorDefinitionStorage () {
  var self = this
  IColorDefinitionStorage.call(self)

  self._storage.open()
    .done(function () { self._ready() },
          function (err) { self._ready(err) })
}

inherits(AbstractSyncColorDefinitionStorage, IColorDefinitionStorage)
_.extend(AbstractSyncColorDefinitionStorage, IColorDefinitionStorage)

/**
 * @param {string} desc
 * @param {Object} [opts]
 * @param {boolean} [opts.autoAdd=true]
 * @return {Promise.<{record: ?IColorDefinitionStorage~Record, new: ?boolean}>}
 */
AbstractSyncColorDefinitionStorage.prototype.resolve =
function (desc, opts) {
  var storage = this._storage
  return storage.withLock(function () {
    return storage.get(desc)
      .then(function (colorId) {
        // exists?
        colorId = parseInt(colorId, 10)
        if (!isNaN(colorId)) {
          return {record: {id: colorId, desc: desc}, new: false}
        }

        // autoAdd = false
        var autoAdd = Object(opts).autoAdd
        if (!autoAdd && autoAdd !== undefined) {
          return {record: null, new: null}
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
              return {record: {id: newColorId, desc: desc}, new: true}
            })
          })
      })
  })
}

/**
 * @param {Object} [opts]
 * @param {number} [opts.id]
 * @return {Promise.<(
 *   ?IColorDefinitionStorage~Record|
 *   IColorDefinitionStorage~Record[]
 * )>}
 */
AbstractSyncColorDefinitionStorage.prototype.get = function (opts) {
  var storage = this._storage
  return storage.withLock(function () {
    var id = Object(opts).id
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
  var storage = this._storage
  return storage.withLock(function () {
    return storage.clear()
  })
}

module.exports = AbstractSyncColorDefinitionStorage
