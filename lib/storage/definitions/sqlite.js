'use strict'

var _ = require('lodash')
var inherits = require('util').inherits

var SQLiteProvider = require('../providers').SQLite
var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class ColorDefinitionSQLiteStorage
 * @extends AbstractSQLColorDefinitionStorage
 * @param {Object} [opts]
 * @param {string} [opts.filename=cclib.sqlite3]
 */
function ColorDefinitionSQLiteStorage (opts) {
  this._opts = _.extend({filename: 'cclib.sqlite3'}, opts)
  this._storage = new SQLiteProvider(this._opts.filename)
  this._engineName = 'SQLite'

  AbstractSQLColorDefinitionStorage.call(this)
}

inherits(ColorDefinitionSQLiteStorage, AbstractSQLColorDefinitionStorage)
_.extend(ColorDefinitionSQLiteStorage, AbstractSQLColorDefinitionStorage)

ColorDefinitionSQLiteStorage.isAvailable = SQLiteProvider.isAvailable

module.exports = ColorDefinitionSQLiteStorage
