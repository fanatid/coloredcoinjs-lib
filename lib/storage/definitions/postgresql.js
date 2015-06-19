'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var PostgreSQLStorage = require('odd-storage')(Promise).PostgreSQL

var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class ColorDefinitionPostgreSQLStorage
 * @extends AbstractSQLColorDefinitionStorage
 * @param {Object} opts
 * @param {string} opts.url
 * @param {boolean} [opts.native=false]
 */
function ColorDefinitionPostgreSQLStorage (opts) {
  this._storage = new PostgreSQLStorage(opts)

  AbstractSQLColorDefinitionStorage.call(this)
}

inherits(ColorDefinitionPostgreSQLStorage, AbstractSQLColorDefinitionStorage)
_.extend(ColorDefinitionPostgreSQLStorage, AbstractSQLColorDefinitionStorage)

ColorDefinitionPostgreSQLStorage.isAvailable = PostgreSQLStorage.isAvailable

module.exports = ColorDefinitionPostgreSQLStorage
