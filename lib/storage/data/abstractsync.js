var _ = require('lodash')
var inherits = require('util').inherits

var IColorDataStorage = require('./interface')
var errors = require('../../errors')

/**
 * @class AbstractSyncColorDataStorage
 * @extends IColorDataStorage
 *
 * @param {Object} provider
 */
function AbstractSyncColorDataStorage (provider) {
  var self = this
  IColorDataStorage.call(self)

  self._provider = provider
  self._provider.open()
    .done(function () { self._ready() },
          function (err) { self._ready(err) })
}

inherits(AbstractSyncColorDataStorage, IColorDataStorage)
_.extend(AbstractSyncColorDataStorage, IColorDataStorage)

/**
 * @param {IDataStorage~Record} data
 * @return {Promise.<IDataStorage~Record>}
 */
AbstractSyncColorDataStorage.prototype.add = function (data) {
  var self = this
  return self._provider.transaction(function () {
    // get color values for given txid and colorCode
    var key = data.txid + data.colorCode
    return self._provider.get(key)
      .then(function (result) {
        var value = JSON.stringify(data.value)
        var values = result !== null
                       ? JSON.parse(result)
                       : {}

        var outValues = values[data.oidx] || {}

        // throw error if value for given colorId already exists
        if (outValues[data.colorId] !== undefined &&
            outValues[data.colorId] !== value) {
          throw new errors.Storage.ColorData.HaveAnotherValue(
            data.txid, data.oidx,
            data.colorId, data.colorCode, outValues[data.colorId])
        }

        // set value and save
        outValues[data.colorId] = value
        values[data.oidx] = outValues
        return self._provider.set(key, JSON.stringify(values))
      })
  })
  .then(function () {
    // return new record
    return {
      colorCode: data.colorCode,
      txid: data.txid,
      oidx: data.oidx,
      colorId: data.colorId,
      value: data.value
    }
  })
}

/**
 * @param {Object} opts
 * @param {string} opts.colorCode
 * @param {string} opts.txid
 * @param {number} [opts.oidx]
 * @return {Promise.<Object>}
 */
AbstractSyncColorDataStorage.prototype.get = function (opts) {
  var self = this
  return self._provider.transaction(function () {
    var key = opts.txid + opts.colorCode
    return self._provider.get(key)
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
  var self = this
  return self._provider.transaction(function () {
    return self._provider.remove(opts.txid + opts.colorCode)
  })
}

/**
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.clear = function () {
  var self = this
  return self._provider.transaction(function () {
    return self._provider.clear()
  })
}

module.exports = AbstractSyncColorDataStorage
