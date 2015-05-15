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
  if (!(this instanceof ColorDefinitionWebSQLStorage)) {
    return new ColorDefinitionWebSQLStorage()
  }

  opts = _.extend({
    dbName: 'cclib-definitions',
    dbSize: 5
  }, opts)

  var storage = new WebSQLProvider(opts.dbName, opts.dbSize)
  AbstractSQLColorDefinitionStorage.call(this, storage)
}

inherits(ColorDefinitionWebSQLStorage, AbstractSQLColorDefinitionStorage)

/**
 * @return {boolean}
 */
ColorDefinitionWebSQLStorage.isAvailable = function () {
  try {
    return 'openDatabase' in window && _.isFunction(window.openDatabase)
  } catch (err) {
    return false
  }
}

module.exports = ColorDefinitionWebSQLStorage
