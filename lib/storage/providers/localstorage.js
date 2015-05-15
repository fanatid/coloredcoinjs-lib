/* global localStorage */

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
 * @param {string} key
 * @param {string} value
 */
LocalStorageProvider.prototype.set = function (key, value) {
  localStorage.setItem(this._prefix + key, value)
}

/**
 * @param {?string} key
 */
LocalStorageProvider.prototype.get = function (key) {
  return localStorage.getItem(this._prefix + key)
}

/**
 * @callback LocalStorage~iterateCallback
 * @param {string} key
 * @param {string} value
 */

/**
 * @param {LocalStorage~iterateCallback} callback
 */
LocalStorageProvider.prototype.iterate = function (callback) {
  var prefixLength = this._prefix.length

  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i)
    if (key.substring(0, prefixLength) === this._prefix) {
      var value = localStorage.getItem(key)
      callback(key.substring(prefixLength), value)
    }
  }
}

/**
 */
LocalStorageProvider.prototype.clear = function () {
  var keys = []
  this.iterate(function (key) {
    keys.push(key)
  })

  var prefix = this._prefix
  keys.forEach(function (key) {
    localStorage.removeItem(prefix + key)
  })
}

module.exports = LocalStorageProvider
