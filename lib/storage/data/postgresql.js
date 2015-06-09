var _ = require('lodash')
var inherits = require('util').inherits

var PostgreSQLProvider = require('../providers').PostgreSQL
var AbstractSQLColorDataStorage = require('./abstractsql')

/**
 * @class ColorDataPostgreSQLStorage
 * @extends AbstractSQLColorDataStorage
 *
 * @param {Object} opts
 * @param {string} opts.url
 * @param {boolean} [opts.native=false]
 */
function ColorDataPostgreSQLStorage (opts) {
  var provider = new PostgreSQLProvider(_.extend({native: false}, opts))
  AbstractSQLColorDataStorage.call(this, provider)
}

inherits(ColorDataPostgreSQLStorage, AbstractSQLColorDataStorage)
_.extend(ColorDataPostgreSQLStorage, AbstractSQLColorDataStorage)

ColorDataPostgreSQLStorage.isAvailable = PostgreSQLProvider.isAvailable

module.exports = ColorDataPostgreSQLStorage
