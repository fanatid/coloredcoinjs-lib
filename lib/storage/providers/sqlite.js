/* globals Promise:true */
var Promise = require('bluebird')
var makeConcurrent = require('make-concurrent')(Promise)
var sqlite3 = require('sqlite3')

/**
 * @class SQLiteProvider
 */
function SQLiteProvider (filename) {
  this._filename = filename
}

/**
 * @return {Promise}
 */
SQLiteProvider.prototype.open = function () {
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
}

/**
 * @callback SQLiteProvider~transactionCallback
 * @param {Object} tx
 * @param {function} tx.execute
 */

/**
 * @param {SQLiteProvider~transactionCallback} fn
 * @return {Promise}
 */
SQLiteProvider.prototype.transaction = makeConcurrent(function (fn) {
  var self = this
  return Promise.try(function () {
    // create real transaction?
    function execute (sql, args) {
      return self._db.allAsync(sql, args)
        .then(function (rows) { return rows || [] })
    }

    return fn({execute: execute})
  })
})

module.exports = SQLiteProvider
