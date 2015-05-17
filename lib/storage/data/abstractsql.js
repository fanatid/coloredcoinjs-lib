/* globals Promise:true */
var inherits = require('util').inherits
var timers = require('timers')
var Promise = require('bluebird')

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
AbstractSyncColorDataStorage.prototype.addColorValue = function () {
}

/**
 * @param {string} txId
 * @param {number} outIndex
 * @return {Promise.<{colorId: number, value: number}>}
 */
AbstractSyncColorDataStorage.prototype.getColorValues = function () {
}

/**
 * @param {string} txId
 * @param {number} outIndex
 * @return {Promise.<boolean>}
 */
AbstractSyncColorDataStorage.prototype.isColoredOutput = function () {
}

/**
 * @param {string} txId
 * @param {number} outIndex
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.removeOutput = function () {
}

/**
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.clear = function () {
}

/**
 * @return {string}
 */
AbstractSyncColorDataStorage.prototype.inspect = function () {
  return '<storage.data.AbstractSyncColorDataStorage>'
}

module.exports = AbstractSyncColorDataStorage
