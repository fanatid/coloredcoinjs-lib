'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')

var IStorageProvider = require('./interface')

/**
 * @class WebSQLStorageProvider
 * @extends IStorageProvider
 * @param {string} dbName
 * @param {number} dbSize In megabytes
 */
function WebSQLStorageProvider (dbName, dbSize) {
  IStorageProvider.call(this)

  this._dbName = dbName
  this._dbSize = dbSize * 1000 * 1000
}

inherits(WebSQLStorageProvider, IStorageProvider)
_.extend(WebSQLStorageProvider, IStorageProvider)

/**
 * @return {boolean}
 */
WebSQLStorageProvider.isAvailable = function () {
  return _.isFunction(global.openDatabase)
}

/**
 * @return {Promise}
 */
WebSQLStorageProvider.prototype.open = function () {
  var self = this
  return Promise.try(function () {
    self._db = global.openDatabase(
      self._dbName, '1.0', self._dbName, self._dbSize)
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
WebSQLStorageProvider.prototype.executeSQL = function (sql, args) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      return new Promise(function (resolve, reject) {
        self._db.transaction(function (tx) {
          function onResolve (t, result) {
            var rows = []
            while (rows.length < result.rows.length) {
              rows.push(result.rows.item(rows.length))
            }

            resolve(rows)
          }

          function onReject (t, err) {
            reject(new Error(err.message))
          }

          tx.executeSql(sql, args, onResolve, onReject)
        })
      })
    })
}

module.exports = WebSQLStorageProvider
