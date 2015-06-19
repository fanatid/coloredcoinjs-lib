'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var SQLiteStorage = require('odd-storage')(Promise).SQLite

var AbstractSQLColorDataStorage = require('./abstractsql')

/**
 * @class ColorDataSQLiteStorage
 * @extends AbstractSQLColorDataStorage
 * @param {Object} [opts]
 * @param {string} [opts.filename=cclib.sqlite3]
 */
function ColorDataSQLiteStorage (opts) {
  opts = _.extend({filename: 'cclib.sqlite'}, opts)
  this._storage = new SQLiteStorage(opts)

  AbstractSQLColorDataStorage.call(this)
}

inherits(ColorDataSQLiteStorage, AbstractSQLColorDataStorage)
_.extend(ColorDataSQLiteStorage, AbstractSQLColorDataStorage)

ColorDataSQLiteStorage.isAvailable = SQLiteStorage.isAvailable

module.exports = ColorDataSQLiteStorage
