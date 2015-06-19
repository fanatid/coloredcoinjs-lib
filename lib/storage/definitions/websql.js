'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var WebSQLStorage = require('odd-storage')(Promise).WebSQL

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
  this._storage = new WebSQLStorage(opts)

  AbstractSQLColorDefinitionStorage.call(this)
}

inherits(ColorDefinitionWebSQLStorage, AbstractSQLColorDefinitionStorage)
_.extend(ColorDefinitionWebSQLStorage, AbstractSQLColorDefinitionStorage)

ColorDefinitionWebSQLStorage.isAvailable = WebSQLStorage.isAvailable

module.exports = ColorDefinitionWebSQLStorage
