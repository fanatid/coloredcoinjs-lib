var inherits = require('util').inherits
var timers = require('timers')

var IColorDataStorage = require('./interface')

/**
 * @class AbstractSyncColorDataStorage
 * @extends IColorDataStorage
 *
 * @param {Object} provider
 */
function AbstractSyncColorDataStorage (provider) {
  var self = this

  self._provider = provider
  IColorDataStorage.call(self)

  timers.setImmediate(function () {
    self._provider.open()
      .then(function () { self._ready() },
            function (err) { self._ready(err) })
  })
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
AbstractSyncColorDataStorage.prototype.addColorValue = function (data) {
  var self = this
  return self._provider.transaction(function () {
    // get color values for given txid and vout
    var key = data.txId + ':' + data.outIndex
    return self._provider.get(key)
      .then(function (result) {
        // throw error if value for given colorId already exists
        var colorValues = result !== null
                            ? JSON.parse(result)
                            : {}

        if (colorValues[data.colorId] !== undefined) {
          var msg = 'Value for output ' + key +
            ' with colorId ' + data.colorId + ' already exists.'
          throw new Error(msg)
        }

        // set value and save
        colorValues[data.colorId] = data.value
        return self._provider.set(key, JSON.stringify(colorValues))
      })
  })
  .then(function () {
    // return new record
    return {
      txId: data.txId,
      outIndex: data.outIndex,
      colorId: data.colorId,
      value: data.value
    }
  })
}

/**
 * @param {string} txId
 * @param {number} outIndex
 * @return {Promise.<{colorId: number, value: number}>}
 */
AbstractSyncColorDataStorage.prototype.getColorValues = function (txId, outIndex) {
  var self = this
  return self._provider.transaction(function () {
    var key = txId + ':' + outIndex
    return self._provider.get(key)
      .then(function (result) {
        return result === null ? {} : JSON.parse(result)
      })
  })
}

/**
 * @param {string} txId
 * @param {number} outIndex
 * @return {Promise.<boolean>}
 */
AbstractSyncColorDataStorage.prototype.isColoredOutput = function (txId, outIndex) {
  var self = this
  return self._provider.transaction(function () {
    var key = txId + ':' + outIndex
    return self._provider.get(key)
      .then(function (result) {
        return result === null
                 ? false
                 : Object.keys(JSON.parse(result)).length > 0
      })
  })
}

/**
 * @param {string} txId
 * @param {number} outIndex
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.removeOutput = function (txId, outIndex) {
  var self = this
  return self._provider.transaction(function () {
    var key = txId + ':' + outIndex
    return self._provider.remove(key)
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

/**
 * @return {string}
 */
AbstractSyncColorDataStorage.prototype.inspect = function () {
  return '<storage.data.AbstractSyncColorDataStorage>'
}

module.exports = AbstractSyncColorDataStorage
