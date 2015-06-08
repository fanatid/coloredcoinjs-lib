/* global localStorage */
var _ = require('lodash')
var Promise = require('bluebird')
var Random = require('bitcore').crypto.Random
var readyMixin = require('ready-mixin')(Promise)
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

readyMixin(LocalStorageProvider.prototype)

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
    var key = Random.getRandomBuffer(10).toString('hex')
    localStorage.setItem(key, null)
    localStorage.removeItem(key)
  })
  .then(function () { self._ready() }, function (err) {
    self._ready(err)
    throw err
  })
}

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
  return this.ready.then(function () {
    localStorage.setItem(prefix + key, value)
  })
}

/**
 * @param {?string} key
 * @return {Promise.<?string>}
 */
LocalStorageProvider.prototype.get = function (key) {
  var prefix = this._prefix
  return this.ready.then(function () {
    return localStorage.getItem(prefix + key)
  })
}

/**
 * @param {?string} key
 * @return {Promise}
 */
LocalStorageProvider.prototype.remove = function (key) {
  var prefix = this._prefix
  return this.ready.then(function () {
    localStorage.removeItem(prefix + key)
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
  var self = this

  return self.ready.then(function () {
    return new Promise(function (resolve, reject) {
      var prefixLength = self._prefix.length

      function next (i) {
        if (i >= localStorage.length) {
          return resolve()
        }

        var key = localStorage.key(i)
        if (key.substring(0, prefixLength) !== self._prefix) {
          return next(i + 1)
        }

        var value = localStorage.getItem(key)
        Promise.try(function () {
          return callback(key.substring(prefixLength), value)
        })
        .then(function () { next(i + 1) }, reject)
      }

      next(0)
    })
  })
}

/**
 * @return {Promise}
 */
LocalStorageProvider.prototype.clear = function () {
  var self = this
  return self.ready.then(function () {
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
