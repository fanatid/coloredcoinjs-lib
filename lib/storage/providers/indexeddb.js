var _ = require('lodash')
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)
var makeConcurrent = require('make-concurrent')(Promise)

// https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/open
global.indexedDB = (global.indexedDB ||
                    global.mozIndexedDB ||
                    global.webkitIndexedDB ||
                    global.msIndexedDB)

/**
 * @class IndexedDBProvider
 * @param {string} dbName
 */
function IndexedDBProvider (dbName) {
  this._dbName = dbName
}

readyMixin(IndexedDBProvider.prototype)

IndexedDBProvider.isAvailable = function () {
  return (_.isObject(global.indexedDB) &&
          _.isFunction(global.indexedDB.open))
}

/**
 * @return {Promise}
 */
IndexedDBProvider.prototype.open = function () {
  var self = this
  return new Promise(function (resolve, reject) {
    var req = global.indexedDB.open(self._dbName, 1)

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
 * @callback IndexedDBProvider~transactionCallback
 * @return {Promise}
 */

/**
 * @param {IndexedDBProvider~transactionCallback} callback
 * @return {Promise}
 */
IndexedDBProvider.prototype.transaction = makeConcurrent(function (callback) {
  return Promise.try(function () { return callback() })
})

/**
 * @param {string} key
 * @param {string} value
 * @return {Promise}
 */
IndexedDBProvider.prototype.set = function (key, value) {
  var self = this
  return self.ready.then(function () {
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
IndexedDBProvider.prototype.get = function (key) {
  var self = this
  return self.ready.then(function () {
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
IndexedDBProvider.prototype.remove = function (key) {
  var self = this
  return self.ready.then(function () {
    return new Promise(function (resolve, reject) {
      var tx = self._db.transaction(self._dbName, 'readwrite')
      var req = tx.objectStore(self._dbName).delete(key)

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
 * @callback LocalStorage~iterateCallback
 * @param {string} key
 * @param {string} value
 */

/**
 * @param {LocalStorage~iterateCallback} callback
 * @return {Promise}
 */
IndexedDBProvider.prototype.iterate = function (callback) {
  var self = this
  return self.ready.then(function () {
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
IndexedDBProvider.prototype.clear = function () {
  var self = this
  return self.ready.then(function () {
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

module.exports = IndexedDBProvider
