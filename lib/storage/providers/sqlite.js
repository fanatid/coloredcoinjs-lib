var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var sqlite3 = require('sqlite3')

var IStorageProvider = require('./interface')

/**
 * @class SQLiteStorageProvider
 * @extends IStorageProvider
 * @param {string} filename
 */
function SQLiteStorageProvider (filename) {
  IStorageProvider.call(this)

  this._filename = filename
}

inherits(SQLiteStorageProvider, IStorageProvider)
_.extend(SQLiteStorageProvider, IStorageProvider)

/**
 * @return {boolean}
 */
SQLiteStorageProvider.isAvailable = function () { return true }

/**
 * @return {Promise}
 */
SQLiteStorageProvider.prototype.open = function () {
  var self = this
  return new Promise(function (resolve, reject) {
    var db = new sqlite3.Database(self._filename, function (err) {
      if (err !== null) {
        return reject(err)
      }

      resolve()
    })

    self._db = Promise.promisifyAll(db)
  })
  .then(function () { self._ready() }, function (err) {
    self._ready(err)
    throw err
  })
}

/**
 * @param {string} sql
 * @param {Array.<*>} [args]
 * @return {Promise}
 */
SQLiteStorageProvider.prototype.executeSQL = function (sql, args) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      return self._db.allAsync(sql, args)
    })
    .then(function (rows) {
      return rows || []
    })
}

module.exports = SQLiteStorageProvider
