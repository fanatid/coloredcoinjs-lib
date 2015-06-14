'use strict'

var _ = require('lodash')
var inherits = require('util').inherits

var WebSQLProvider = require('../providers').WebSQL
var AbstractSQLColorDataStorage = require('./abstractsql')

/**
 * @class ColorDataWebSQLStorage
 * @extends AbstractSQLColorDataStorage
 * @param {Object} [opts]
 * @param {string} [opts.dbName=cclib]
 * @param {number} [opts.dbSize=50] In MB
 */
function ColorDataWebSQLStorage (opts) {
  opts = _.extend({dbName: 'cclib', dbSize: 50}, opts)
  this._storage = new WebSQLProvider(opts.dbName, opts.dbSize)
  this._engineName = 'SQLite'

  AbstractSQLColorDataStorage.call(this)
}

inherits(ColorDataWebSQLStorage, AbstractSQLColorDataStorage)
_.extend(ColorDataWebSQLStorage, AbstractSQLColorDataStorage)

ColorDataWebSQLStorage.isAvailable = WebSQLProvider.isAvailable

module.exports = ColorDataWebSQLStorage
