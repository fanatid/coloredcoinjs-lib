var _ = require('lodash')

/**
 * @class MemoryProvider
 */
function MemoryProvider (prefix) {
  this._data = {}
}

/**
 * @param {string} key
 * @param {string} value
 */
MemoryProvider.prototype.set = function (key, value) {
  this._data[key] = value.toString()
}

/**
 * @param {?string} key
 */
MemoryProvider.prototype.get = function (key) {
  var val = this._data[key]
  return val === undefined ? null : val
}

/**
 * @callback LocalStorage~iterateCallback
 * @param {string} key
 * @param {string} value
 */

/**
 * @param {LocalStorage~iterateCallback} callback
 */
MemoryProvider.prototype.iterate = function (callback) {
  _.each(this._data, function (value, key) {
    callback(key, value)
  })
}

/**
 */
MemoryProvider.prototype.clear = function () {
  this._data = {}
}

module.exports = MemoryProvider
