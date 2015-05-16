/* globals Promise:true */
var _ = require('lodash')
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)
var makeConcurrent = require('make-concurrent')(Promise)

/**
 * @class WebSQLProvider
 * @param {string} dbName
 * @param {number} dbSize In megabytes
 */
function WebSQLProvider (dbName, dbSize) {
  this._dbName = dbName
  this._dbSize = dbSize * 1000 * 1000
}

readyMixin(WebSQLProvider.prototype)

/**
 * @return {boolean}
 */
WebSQLProvider.isAvailable = function () {
  return _.isFunction(global.openDatabase)
}

/**
 * @return {Promise}
 */
WebSQLProvider.prototype.open = function () {
  var self = this
  return Promise.try(function () {
    self._db = global.openDatabase(
      self._dbName, '1.0', self._dbName, self._dbSize)
  })
  .then(function () { self._ready() },
        function (err) { self._ready(err) })
}

/**
 * @callback WebSQLProvider~transactionCallback
 * @param {Object} tx
 * @param {function} tx.execute
 */

/**
 * @param {WebSQLProvider~transactionCallback} fn
 * @return {Promise}
 */
WebSQLProvider.prototype.transaction = makeConcurrent(function (fn) {
  var self = this
  return self.ready.then(function () {
    return new Promise(function (resolve, reject) {
      self._db.transaction(function (tx) {
        function execute (sql, args) {
          return new Promise(function (resolve, reject) {
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
        }

        Promise.try(function () {
          return fn({execute: execute})
        })
        .then(resolve, reject)
      })
    })
  })
})

module.exports = WebSQLProvider
