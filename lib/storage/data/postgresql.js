'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var PostgreSQLStorage = require('odd-storage')(Promise).PostgreSQL

var AbstractSQLColorDataStorage = require('./abstractsql')

/**
 * @class ColorDataPostgreSQLStorage
 * @extends AbstractSQLColorDataStorage
 * @param {Object} opts
 * @param {string} opts.url
 * @param {boolean} [opts.native=false]
 */
function ColorDataPostgreSQLStorage (opts) {
  this._storage = new PostgreSQLStorage(opts)

  AbstractSQLColorDataStorage.call(this)
}

inherits(ColorDataPostgreSQLStorage, AbstractSQLColorDataStorage)
_.extend(ColorDataPostgreSQLStorage, AbstractSQLColorDataStorage)

ColorDataPostgreSQLStorage.isAvailable = PostgreSQLStorage.isAvailable

module.exports = ColorDataPostgreSQLStorage
