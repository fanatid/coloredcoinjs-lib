'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var pg = require('pg')

var IStorageProvider = require('./interface')

/**
 * @class PostgreSQLStorageProvider
 * @extends IStorageProvider
 * @param {Object} opts
 * @param {string} opts.url
 * @param {boolean} [opts.native=true]
 */
function PostgreSQLStorageProvider (opts) {
  IStorageProvider.call(this)

  this._pg = Promise.promisifyAll(opts.native === true ? pg.native : pg)
  this._url = opts.url
}

inherits(PostgreSQLStorageProvider, IStorageProvider)
_.extend(PostgreSQLStorageProvider, IStorageProvider)

/**
 * @return {boolean}
 */
PostgreSQLStorageProvider.isAvailable = function () { return true }

/**
 * @return {Promise}
 */
PostgreSQLStorageProvider.prototype.open = function () {
  var self = this
  return this._execute('SELECT * FROM information_schema.tables')
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
PostgreSQLStorageProvider.prototype._execute = function (sql, args) {
  return this._pg.connectAsync(this._url)
    .spread(function (client, done) {
      return client.queryAsync(sql, args)
        .then(function (ret) {
          done()
          return ret.rows

        }, function (err) {
          client.end()
          throw err

        })
    })
}

/**
 * @param {string} sql
 * @param {Array.<*>} [args]
 * @return {Promise}
 */
PostgreSQLStorageProvider.prototype.executeSQL = function (sql, args) {
  var self = this
  return self._isOpenedCheckPromise()
    .then(function () {
      return self._execute(sql, args)
    })
}

module.exports = PostgreSQLStorageProvider

