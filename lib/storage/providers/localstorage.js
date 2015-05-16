/* globals Promise:true */
/* global localStorage */
var _ = require('lodash')
var Promise = require('bluebird')
var makeConcurrent = require('make-concurrent')(Promise)

/**
 * @class LocalStorageProvider
 * @param {string} prefix
 */
function LocalStorageProvider (prefix) {
  if (prefix === undefined) {
    prefix = 'cclib_definitions'
  }

  this._prefix = prefix + '/'
}

/**
 * @return {boolean}
 */
LocalStorageProvider.isAvailable = function () {
  return (_.isObject(global.localStorage) &&
          _.isFunction(global.localStorage.getItem) &&
          _.isFunction(global.localStorage.setItem) &&
          _.isFunction(global.localStorage.clear))
}

/**
 * @return {Promise}
 */
LocalStorageProvider.prototype.open = function () { return Promise.resolve() }

/**
 * @callback LocalStorageProvider~transactionCallback
 * @return {Promise}
 */

/**
 * @param {LocalStorageProvider~transactionCallback} callback
 * @return {Promise}
 */
LocalStorageProvider.prototype.transaction = makeConcurrent(function (callback) {
  return Promise.try(function () { return callback() })
})

/**
 * @param {string} key
 * @param {string} value
 * @return {Promise}
 */
LocalStorageProvider.prototype.set = function (key, value) {
  var prefix = this._prefix
  return Promise.try(function () {
    localStorage.setItem(prefix + key, value)
  })
}

/**
 * @param {?string} key
 * @return {Promise.<string>}
 */
LocalStorageProvider.prototype.get = function (key) {
  var prefix = this._prefix
  return Promise.try(function () {
    return localStorage.getItem(prefix + key)
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
LocalStorageProvider.prototype.iterate = function (callback) {
  var prefix = this._prefix

  return Promise.try(function () {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i)
      if (key.substring(0, prefix.length) === prefix) {
        var value = localStorage.getItem(key)
        callback(key.substring(prefix.length), value)
      }
    }
  })
}

/**
 * @return {Promise}
 */
LocalStorageProvider.prototype.clear = function () {
  var self = this
  return Promise.try(function () {
    var keys = []
    return self.iterate(function (key) {
      keys.push(key)
    })
    .then(function () {
      var prefix = self._prefix
      keys.forEach(function (key) {
        localStorage.removeItem(prefix + key)
      })
    })
  })
}

module.exports = LocalStorageProvider
