/* global localStorage */
'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var bitcore = require('bitcore')

var IStorageProvider = require('./interface')

/**
 * @class LocalStorageProvider
 * @extends IStorageProvider
 * @param {string} prefix
 */
function LocalStorageProvider (prefix) {
  IStorageProvider.call(this)

  this._prefix = (prefix === undefined ? 'cclib_definitions' : prefix) + '/'
}

inherits(LocalStorageProvider, IStorageProvider)
_.extend(LocalStorageProvider, IStorageProvider)

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
LocalStorageProvider.prototype.open = function () {
  var self = this
  return Promise.try(function () {
    var key = bitcore.crypto.Random.getRandomBuffer(15).toString('hex')
    localStorage.setItem(key, null)
    localStorage.removeItem(key)
  })
  .then(function () { self._ready() }, function (err) {
    self._ready(err)
    throw err
  })
}

/**
 * @param {string} key
 * @param {string} value
 * @return {Promise}
 */
LocalStorageProvider.prototype.set = function (key, value) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      localStorage.setItem(self._prefix + key, value)
    })
}

/**
 * @param {?string} key
 * @return {Promise.<?string>}
 */
LocalStorageProvider.prototype.get = function (key) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      return localStorage.getItem(self._prefix + key)
    })
}

/**
 * @param {?string} key
 * @return {Promise}
 */
LocalStorageProvider.prototype.remove = function (key) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      localStorage.removeItem(self._prefix + key)
    })
}

/**
 * @param {IStorageProvider~iterateCallback} callback
 * @return {Promise}
 */
LocalStorageProvider.prototype.iterate = function (callback) {
  var self = this

  return self._isOpenedCheckPromise()
    .then(function () {
      var prefixLength = self._prefix.length
      return Promise.reduce(_.range(localStorage.length), function (__, i) {
        var key = localStorage.key(i)
        if (key.substring(0, prefixLength) !== self._prefix) {
          return
        }

        var value = localStorage.getItem(key)
        return callback(key.substring(prefixLength), value)
      }, null)
    })
}

/**
 * @return {Promise}
 */
LocalStorageProvider.prototype.clear = function () {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      var keys = []
      return self.iterate(function (key) { keys.push(key) })
        .then(function () {
          keys.forEach(function (key) {
            localStorage.removeItem(self._prefix + key)
          })
        })
    })
}

module.exports = LocalStorageProvider
