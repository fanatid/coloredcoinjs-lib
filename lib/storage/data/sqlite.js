var _ = require('lodash')
var inherits = require('util').inherits

var SQLiteProvider = require('../providers').SQLite
var AbstractSQLColorDataStorage = require('./abstractsql')

/**
 * @class ColorDataSQLiteStorage
 * @extends AbstractSQLColorDataStorage
 * @param {Object} [opts]
 * @param {string} [opts.filename=cclib.sqlite3]
 */
function ColorDataSQLiteStorage (opts) {
  opts = _.extend({filename: 'cclib.sqlite'}, opts)
  this._storage = new SQLiteProvider(opts.filename)
  this._engineName = 'SQLite'

  AbstractSQLColorDataStorage.call(this)
}

inherits(ColorDataSQLiteStorage, AbstractSQLColorDataStorage)
_.extend(ColorDataSQLiteStorage, AbstractSQLColorDataStorage)

ColorDataSQLiteStorage.isAvailable = SQLiteProvider.isAvailable

module.exports = ColorDataSQLiteStorage
