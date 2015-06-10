var _ = require('lodash')
var inherits = require('util').inherits

var PostgreSQLProvider = require('../providers').PostgreSQL
var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class ColorDefinitionPostgreSQLStorage
 * @extends AbstractSQLColorDefinitionStorage
 * @param {Object} opts
 * @param {string} opts.url
 * @param {boolean} [opts.native=false]
 */
function ColorDefinitionPostgreSQLStorage (opts) {
  opts = _.extend({native: false}, opts)
  this._storage = new PostgreSQLProvider(opts)
  this._engineName = 'PostgreSQL'

  AbstractSQLColorDefinitionStorage.call(this)
}

inherits(ColorDefinitionPostgreSQLStorage, AbstractSQLColorDefinitionStorage)
_.extend(ColorDefinitionPostgreSQLStorage, AbstractSQLColorDefinitionStorage)

ColorDefinitionPostgreSQLStorage.isAvailable = PostgreSQLProvider.isAvailable

module.exports = ColorDefinitionPostgreSQLStorage
