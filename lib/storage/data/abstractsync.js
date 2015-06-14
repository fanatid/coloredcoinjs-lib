'use strict'

var _ = require('lodash')
var inherits = require('util').inherits

var IColorDataStorage = require('./interface')
var errors = require('../../errors')

/**
 * @class AbstractSyncColorDataStorage
 * @extends IColorDataStorage
 */
function AbstractSyncColorDataStorage () {
  var self = this
  IColorDataStorage.call(self)

  self._storage.open()
    .done(function () { self._ready() },
          function (err) { self._ready(err) })
}

inherits(AbstractSyncColorDataStorage, IColorDataStorage)
_.extend(AbstractSyncColorDataStorage, IColorDataStorage)

/**
 * @param {IDataStorage~Record} data
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.add = function (data) {
  var storage = this._storage
  return storage.transaction(function () {
    // get color values for given txid and colorCode
    var key = data.txid + data.colorCode
    return storage.get(key)
      .then(function (result) {
        var value = JSON.stringify(data.value)
        var values = result !== null
                       ? JSON.parse(result)
                       : {}

        var outValues = values[data.oidx] || {}

        // throw error if value for given colorId already exists and have
        //   not same value
        if (outValues[data.colorId] !== undefined) {
          if (outValues[data.colorId] === value) {
            return
          }

          throw new errors.Storage.ColorData.HaveAnotherValue(
            data.txid, data.oidx,
            data.colorId, data.colorCode, outValues[data.colorId])
        }

        // set value and save
        outValues[data.colorId] = value
        values[data.oidx] = outValues
        return storage.set(key, JSON.stringify(values))
      })
  })
  .then(_.noop)
}

/**
 * @param {Object} opts
 * @param {string} opts.colorCode
 * @param {string} opts.txid
 * @param {number} [opts.oidx]
 * @return {Promise.<Object>}
 */
AbstractSyncColorDataStorage.prototype.get = function (opts) {
  var storage = this._storage
  return storage.transaction(function () {
    var key = opts.txid + opts.colorCode
    return storage.get(key)
      .then(function (result) {
        var values = result === null ? {} : JSON.parse(result)

        if (opts.oidx !== undefined) {
          var newValues = {}
          if (values[opts.oidx] !== undefined) {
            newValues[opts.oidx] = values[opts.oidx]
          }

          values = newValues
        }

        _.each(values, function (data) {
          _.each(data, function (value, key) {
            data[key] = JSON.parse(value)
          })
        })

        return values
      })
  })
}

/**
 * @param {Object} opts
 * @param {string} opts.colorCode
 * @param {string} opts.txid
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.remove = function (opts) {
  var storage = this._storage
  return storage.transaction(function () {
    return storage.remove(opts.txid + opts.colorCode)
  })
}

/**
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.clear = function () {
  var storage = this._storage
  return storage.transaction(function () {
    return storage.clear()
  })
}

module.exports = AbstractSyncColorDataStorage
