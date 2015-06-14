'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')

var IStorageProvider = require('./interface')

// https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open
var indexedDB = (global.indexedDB ||
                 global.mozIndexedDB ||
                 global.webkitIndexedDB ||
                 global.msIndexedDB)

/**
 * @class IndexedDBStorageProvider
 * @extends IStorageProvider
 * @param {string} dbName
 */
function IndexedDBStorageProvider (dbName) {
  IStorageProvider.call(this)

  this._dbName = dbName
}

inherits(IndexedDBStorageProvider, IStorageProvider)
_.extend(IndexedDBStorageProvider, IStorageProvider)

IndexedDBStorageProvider.isAvailable = function () {
  return (_.isObject(indexedDB) &&
          _.isFunction(indexedDB.open))
}

/**
 * @return {Promise}
 */
IndexedDBStorageProvider.prototype.open = function () {
  var self = this
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(self._dbName, 1)

    req.onerror = function () {
      reject(req.error)
    }

    req.onupgradeneeded = function () {
      req.result.createObjectStore(self._dbName)
    }

    req.onsuccess = function () {
      self._db = req.result
      resolve()
    }
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
IndexedDBStorageProvider.prototype.set = function (key, value) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      return new Promise(function (resolve, reject) {
        var tx = self._db.transaction(self._dbName, 'readwrite')
        var req = tx.objectStore(self._dbName).put(String(value), key)

        tx.oncomplete = function () {
          resolve()
        }

        tx.onabort = tx.onerror = function () {
          var err = req.error ? req.error : req.transaction.error
          reject(err)
        }
      })
    })
}

/**
 * @param {?string} key
 * @return {Promise.<?string>}
 */
IndexedDBStorageProvider.prototype.get = function (key) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      return new Promise(function (resolve, reject) {
        var tx = self._db.transaction(self._dbName, 'readonly')
        var req = tx.objectStore(self._dbName).get(key)

        req.onsuccess = function () {
          resolve(req.result === undefined ? null : req.result)
        }

        req.onerror = function () {
          reject(req.error)
        }
      })
    })
}

/**
 * @param {?string} key
 * @return {Promise}
 */
IndexedDBStorageProvider.prototype.remove = function (key) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      return new Promise(function (resolve, reject) {
        var tx = self._db.transaction(self._dbName, 'readwrite')
        var req = tx.objectStore(self._dbName).delete(key)

        tx.oncomplete = resolve
        tx.onabort = tx.onerror = function () {
          var err = req.error ? req.error : req.transaction.error
          reject(err)
        }
      })
    })
}

/**
 * @param {IStorageProvider~iterateCallback} callback
 * @return {Promise}
 */
IndexedDBStorageProvider.prototype.iterate = function (callback) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      return new Promise(function (resolve, reject) {
        var tx = self._db.transaction(self._dbName, 'readonly')
        var req = tx.objectStore(self._dbName).openCursor()

        req.onsuccess = function () {
          var cursor = req.result

          if (cursor === null) {
            return resolve()
          }

          Promise.try(function () {
            return callback(cursor.key, cursor.value)
          })
          .then(function () {
            cursor.continue()
          })
          .catch(reject)
        }

        req.onerror = function () {
          reject(req.error)
        }
      })
    })
}

/**
 * @return {Promise}
 */
IndexedDBStorageProvider.prototype.clear = function () {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      return new Promise(function (resolve, reject) {
        var tx = self._db.transaction(self._dbName, 'readwrite')
        var req = tx.objectStore(self._dbName).clear()

        tx.oncomplete = function () {
          resolve()
        }

        tx.onabort = tx.onerror = function () {
          var err = req.error ? req.error : req.transaction.error
          reject(err)
        }
      })
    })
}

module.exports = IndexedDBStorageProvider
