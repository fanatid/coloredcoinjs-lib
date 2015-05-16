/* globals Promise:true */
var _ = require('lodash')
var Promise = require('bluebird')
var makeConcurrent = require('make-concurrent')(Promise)

/**
 * @class MemoryProvider
 */
function MemoryProvider (prefix) {
  this._data = {}
}

/**
 * @return {boolean}
 */
MemoryProvider.isAvailable = function () { return true }

/**
 * @return {Promise}
 */
MemoryProvider.prototype.open = function () { return Promise.resolve() }

/**
 * @callback MemoryProvider~transactionCallback
 * @return {Promise}
 */

/**
 * @param {MemoryProvider~transactionCallback} callback
 * @return {Promise}
 */
MemoryProvider.prototype.transaction = makeConcurrent(function (callback) {
  return Promise.try(function () { return callback() })
})

/**
 * @param {string} key
 * @param {string} value
 * @return {Promise}
 */
MemoryProvider.prototype.set = function (key, value) {
  var self = this
  return Promise.try(function () {
    self._data[key] = String(value)
  })
}

/**
 * @param {?string} key
 * @return {Promise.<string>}
 */
MemoryProvider.prototype.get = function (key) {
  var self = this
  return Promise.try(function () {
    var val = self._data[key]
    return val === undefined ? null : val
  })
}

/**
 * @callback LocalStorage~iterateCallback
 * @param {string} key
 * @param {string} value
 */

/**
 * @param {LocalStorage~iterateCallback} callback
 * @return {Promise}
 */
MemoryProvider.prototype.iterate = function (callback) {
  var self = this
  return Promise.try(function () {
    _.each(self._data, function (value, key) {
      callback(key, value)
    })
  })
}

/**
 * @return {Promise}
 */
MemoryProvider.prototype.clear = function () {
  var self = this
  return Promise.try(function () {
    self._data = {}
  })
}

module.exports = MemoryProvider
