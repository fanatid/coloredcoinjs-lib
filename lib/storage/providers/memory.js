/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)
var makeConcurrent = require('make-concurrent')(Promise)

/**
 * @class MemoryProvider
 */
function MemoryProvider (prefix) {
  this._data = {}
}

readyMixin(MemoryProvider.prototype)

/**
 * @return {boolean}
 */
MemoryProvider.isAvailable = function () { return true }

/**
 * @return {Promise}
 */
MemoryProvider.prototype.open = function () {
  this._ready()
  return this.ready
}

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
  return self.ready.then(function () {
    self._data[key] = String(value)
  })
}

/**
 * @param {?string} key
 * @return {Promise.<?string>}
 */
MemoryProvider.prototype.get = function (key) {
  var self = this
  return self.ready.then(function () {
    var val = self._data[key]
    return val === undefined ? null : val
  })
}

/**
 * @param {?string} key
 * @return {Promise}
 */
MemoryProvider.prototype.remove = function (key) {
  var self = this
  return self.ready.then(function () {
    delete self._data[key]
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
  return self.ready.then(function () {
    return new Promise(function (resolve, reject) {
      var keys = Object.keys(self._data)

      function next (i) {
        if (i >= keys.length) {
          return resolve()
        }

        Promise.try(function () {
          var key = keys[i]
          return callback(key, self._data[key])
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
MemoryProvider.prototype.clear = function () {
  var self = this
  return self.ready.then(function () {
    self._data = {}
  })
}

module.exports = MemoryProvider
