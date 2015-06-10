var _ = require('lodash')
var inherits = require('util').inherits

var WebSQLProvider = require('../providers').WebSQL
var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class ColorDefinitionWebSQLStorage
 * @extends AbstractSQLColorDefinitionStorage
 * @param {Object} [opts]
 * @param {string} [opts.dbName=cclib]
 * @param {number} [opts.dbSize=5] In MB
 */
function ColorDefinitionWebSQLStorage (opts) {
  opts = _.extend({dbName: 'cclib', dbSize: 5}, opts)
  this._storage = new WebSQLProvider(opts.dbName, opts.dbSize)
  this._engineName = 'SQLite'

  AbstractSQLColorDefinitionStorage.call(this)
}

inherits(ColorDefinitionWebSQLStorage, AbstractSQLColorDefinitionStorage)
_.extend(ColorDefinitionWebSQLStorage, AbstractSQLColorDefinitionStorage)

ColorDefinitionWebSQLStorage.isAvailable = WebSQLProvider.isAvailable

module.exports = ColorDefinitionWebSQLStorage
