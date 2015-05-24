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
 * @param {Object} [opts]
 * @param {boolean} [opts.autoAdd=true]
 * @return {Promise.<?IColorDefinitionStorage~Record>}
 */
AbstractSyncColorDefinitionStorage.prototype.resolve =
function (desc, opts) {
  var self = this
  return self._provider.transaction(function () {
    return self._provider.get(desc)
      .then(function (colorId) {
        // exists?
        colorId = parseInt(colorId, 10)
        if (!isNaN(colorId)) {
          return {id: colorId, desc: desc}
        }

        // autoAdd = false
        var autoAdd = Object(opts).autoAdd
        if (!autoAdd && autoAdd !== undefined) {
          return null
        }

        // get prev color id
        return self._provider.get('~counter')
          .then(function (colorId) {
            // counter exists and ok, return
            colorId = parseInt(colorId, 10)
            if (!isNaN(colorId)) {
              return colorId + 1
            }

            // try get max color id or set to zero
            colorId = 0
            return self._provider.iterate(function (key, value) {
              value = parseInt(value, 10)
              colorId = Math.max(colorId, value)
            })
            .then(function () { return colorId + 1 })
          })
          .then(function (newColorId) {
            // update counter and save desc with new color id
            return Promise.all([
              self._provider.set('~counter', newColorId),
              self._provider.set(desc, newColorId)
            ])
            .then(function () {
              return {id: newColorId, desc: desc}
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
  var self = this
  return self._provider.transaction(function () {
    var id = Object(opts).id
    if (id !== undefined) {
      var record = null
      return self._provider.iterate(function (key, value) {
        value = parseInt(value, 10)
        if (value === id) {
          record = {id: id, desc: key}
        }
      })
      .then(function () { return record })
    }

    var records = []
    return self._provider.iterate(function (key, value) {
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
  var self = this
  return self._provider.transaction(function () {
    return self._provider.clear()
  })
}

module.exports = AbstractSyncColorDefinitionStorage
