'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var SQLiteStorage = require('odd-storage')(Promise).SQLite

var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class ColorDefinitionSQLiteStorage
 * @extends AbstractSQLColorDefinitionStorage
 * @param {Object} [opts]
 * @param {string} [opts.filename=cclib.sqlite3]
 */
function ColorDefinitionSQLiteStorage (opts) {
  opts = _.extend({filename: 'cclib.sqlite3'}, opts)
  this._storage = new SQLiteStorage(opts)

  AbstractSQLColorDefinitionStorage.call(this)
}

inherits(ColorDefinitionSQLiteStorage, AbstractSQLColorDefinitionStorage)
_.extend(ColorDefinitionSQLiteStorage, AbstractSQLColorDefinitionStorage)

ColorDefinitionSQLiteStorage.isAvailable = SQLiteStorage.isAvailable

module.exports = ColorDefinitionSQLiteStorage
