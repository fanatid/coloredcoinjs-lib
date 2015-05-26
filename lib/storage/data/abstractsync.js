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
AbstractSyncColorDataStorage.prototype.addColorValue = function (data) {
  var self = this
  return self._provider.transaction(function () {
    // get color values for given txid and vout
    var key = data.txid + ':' + data.vout
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
      txid: data.txid,
      vout: data.vout,
      colorId: data.colorId,
      value: data.value
    }
  })
}

/**
 * @param {string} txid
 * @param {number} vout
 * @param {number} [colorId]
 * @return {Promise.<(Object|?number)>}
 */
AbstractSyncColorDataStorage.prototype.getColorValues = function (txid, vout, colorId) {
  var self = this
  return self._provider.transaction(function () {
    var key = txid + ':' + vout
    return self._provider.get(key)
      .then(function (result) {
        var values = result === null ? {} : JSON.parse(result)
        if (colorId === undefined) {
          return values
        }

        var value = values[colorId]
        return value === undefined ? null : value
      })
  })
}

/**
 * @param {string} txid
 * @param {number} vout
 * @return {Promise.<boolean>}
 */
AbstractSyncColorDataStorage.prototype.isColoredOutput = function (txid, vout) {
  var self = this
  return self._provider.transaction(function () {
    var key = txid + ':' + vout
    return self._provider.get(key)
      .then(function (result) {
        return result === null
                 ? false
                 : Object.keys(JSON.parse(result)).length > 0
      })
  })
}

/**
 * @param {string} txid
 * @param {number} vout
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.removeOutput = function (txid, vout) {
  var self = this
  return self._provider.transaction(function () {
    var key = txid + ':' + vout
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

module.exports = AbstractSyncColorDataStorage
