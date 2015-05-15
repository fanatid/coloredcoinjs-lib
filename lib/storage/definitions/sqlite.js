var _ = require('lodash')
var inherits = require('util').inherits

var SQLiteProvider = require('../providers/sqlite')
var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class ColorDefinitionSQLiteStorage
 * @extends AbstractSQLColorDefinitionStorage
 *
 * @param {Object} [opts]
 * @param {string} [opts.filename=cclib-defintions.sqlite3]
 */
function ColorDefinitionSQLiteStorage (opts) {
  if (!(this instanceof ColorDefinitionSQLiteStorage)) {
    return new ColorDefinitionSQLiteStorage()
  }

  opts = _.extend({
    filename: 'cclib-definitions.sqlite3'
  }, opts)

  var storage = new SQLiteProvider(opts.filename)
  AbstractSQLColorDefinitionStorage.call(this, storage)
}

inherits(ColorDefinitionSQLiteStorage, AbstractSQLColorDefinitionStorage)

/**
 * @return {boolean}
 */
ColorDefinitionSQLiteStorage.isAvailable = function () { return true }

module.exports = ColorDefinitionSQLiteStorage
