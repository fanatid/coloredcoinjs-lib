var _ = require('lodash')
var inherits = require('util').inherits

var WebSQLProvider = require('../providers/websql')
var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class ColorDefinitionWebSQLStorage
 * @extends AbstractSQLColorDefinitionStorage
 *
 * @param {Object} [opts]
 * @param {string} [opts.dbName=cclib-defintions]
 * @param {number} [opts.dbSize=5] In MB
 */
function ColorDefinitionWebSQLStorage (opts) {
  this._opts = _.extend({
    dbName: 'cclib-definitions',
    dbSize: 5
  }, opts)

  var provider = new WebSQLProvider(this._opts.dbName, this._opts.dbSize)
  AbstractSQLColorDefinitionStorage.call(this, provider)
}

inherits(ColorDefinitionWebSQLStorage, AbstractSQLColorDefinitionStorage)

ColorDefinitionWebSQLStorage.isAvailable = WebSQLProvider.isAvailable

/**
 * @return {string}
 */
ColorDefinitionWebSQLStorage.prototype.inspect = function () {
  return '<storage.definitions.ColorDefinitionWebSQLStorage ' + this._opts.dbName + '>'
}

module.exports = ColorDefinitionWebSQLStorage
