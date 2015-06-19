'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var WebSQLStorage = require('odd-storage')(Promise).WebSQL

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
  this._storage = new WebSQLStorage(opts)

  AbstractSQLColorDataStorage.call(this)
}

inherits(ColorDataWebSQLStorage, AbstractSQLColorDataStorage)
_.extend(ColorDataWebSQLStorage, AbstractSQLColorDataStorage)

ColorDataWebSQLStorage.isAvailable = WebSQLStorage.isAvailable

module.exports = ColorDataWebSQLStorage
