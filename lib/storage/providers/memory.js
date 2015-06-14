'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')

var IStorageProvider = require('./interface')

/**
 * @class MemoryStorageProvider
 * @extends IStorageProvider
 */
function MemoryStorageProvider (prefix) {
  IStorageProvider.call(this)

  this._data = {}
}

inherits(MemoryStorageProvider, IStorageProvider)
_.extend(MemoryStorageProvider, IStorageProvider)

/**
 * @return {boolean}
 */
MemoryStorageProvider.isAvailable = function () { return true }

/**
 * @return {Promise}
 */
MemoryStorageProvider.prototype.open = function () {
  this._ready()
  return this.ready
}

/**
 * @param {string} key
 * @param {string} value
 * @return {Promise}
 */
MemoryStorageProvider.prototype.set = function (key, value) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      self._data[key] = String(value)
    })
}

/**
 * @param {?string} key
 * @return {Promise.<?string>}
 */
MemoryStorageProvider.prototype.get = function (key) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      var value = self._data[key]
      return value === undefined ? null : value
    })
}

/**
 * @param {?string} key
 * @return {Promise}
 */
MemoryStorageProvider.prototype.remove = function (key) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      delete self._data[key]
    })
}

/**
 * @param {IStorageProvider~iterateCallback} callback
 * @return {Promise}
 */
MemoryStorageProvider.prototype.iterate = function (callback) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      return Promise.reduce(_.keys(self._data), function (__, key) {
        return callback(key, self._data[key])
      }, null)
    })
}

/**
 * @return {Promise}
 */
MemoryStorageProvider.prototype.clear = function () {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      self._data = {}
    })
}

module.exports = MemoryStorageProvider
