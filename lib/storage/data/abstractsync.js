var _ = require('lodash')
var inherits = require('util').inherits

var IColorDataStorage = require('./interface')

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

/**
 * @return {boolean}
 */
AbstractSyncColorDataStorage.isAvailable = function () { return false }

/**
 * @param {IDataStorage~Record} data
 * @return {Promise.<IDataStorage~Record>}
 */
AbstractSyncColorDataStorage.prototype.add = function (data) {
  var self = this
  return self._provider.transaction(function () {
    // get color values for given txid and vout
    return self._provider.get(data.txid)
      .then(function (result) {
        // throw error if value for given colorId already exists
        var values = result !== null
                       ? JSON.parse(result)
                       : {}

        var outValues = values[data.vout] || {}
        if (outValues[data.colorId] !== undefined) {
          var msg = 'Value for output ' + data.txid + ':' + data.vout +
            ' with colorId ' + data.colorId + ' already exists.'
          throw new Error(msg)
        }

        // set value and save
        outValues[data.colorId] = data.value
        values[data.vout] = outValues
        return self._provider.set(data.txid, JSON.stringify(values))
      })
  })
  .then(function () {
    // return new record
    return {
      txid: data.txid,
      vout: data.vout,
      colorId: data.colorId,
      value: data.value
    }
  })
}

/**
 * @param {Object} opts
 * @param {string} opts.txid
 * @param {number} [opts.vout]
 * @param {number} [opts.colorId]
 * @return {Promise.<(Object|?number)>}
 */
AbstractSyncColorDataStorage.prototype.get = function (opts) {
  var self = this
  return self._provider.transaction(function () {
    return self._provider.get(opts.txid)
      .then(function (result) {
        var values = result === null ? {} : JSON.parse(result)

        if (opts.vout !== undefined) {
          values = _.get(values, opts.vout, {})
          if (opts.colorId === undefined) {
            return values
          }

          return _.get(values, opts.colorId, null)
        }

        if (opts.colorId !== undefined) {
          return _.reduce(values, function (obj, cvalues, vout) {
            if (cvalues[opts.colorId] !== undefined) {
              obj[vout] = cvalues[opts.colorId]
            }

            return obj
          }, {})
        }

        return values
      })
  })
}

/**
 * @param {string} txid
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.remove = function (txid) {
  var self = this
  return self._provider.transaction(function () {
    return self._provider.remove(txid)
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
