var _ = require('lodash')
var inherits = require('util').inherits

var SQLiteProvider = require('../providers/sqlite')
var AbstractSQLColorDataStorage = require('./abstractsql')

/**
 * @class ColorDataSQLiteStorage
 * @extends AbstractSQLColorDataStorage
 *
 * @param {Object} [opts]
 * @param {string} [opts.filename=cclib-data.sqlite3]
 */
function ColorDataSQLiteStorage (opts) {
  this._opts = _.extend({
    filename: 'cclib-data.sqlite3'
  }, opts)

  var provider = new SQLiteProvider(this._opts.filename)
  AbstractSQLColorDataStorage.call(this, provider)
}

inherits(ColorDataSQLiteStorage, AbstractSQLColorDataStorage)

ColorDataSQLiteStorage.isAvailable = SQLiteProvider.isAvailable

module.exports = ColorDataSQLiteStorage
