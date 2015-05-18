var _ = require('lodash')
var inherits = require('util').inherits

var WebSQLProvider = require('../providers/websql')
var AbstractSQLColorDataStorage = require('./abstractsql')

/**
 * @class ColorDataWebSQLStorage
 * @extends AbstractSQLColorDataStorage
 *
 * @param {Object} [opts]
 * @param {string} [opts.dbName=cclib-data]
 * @param {number} [opts.dbSize=50] In MB
 */
function ColorDataWebSQLStorage (opts) {
  this._opts = _.extend({
    dbName: 'cclib-data',
    dbSize: 50
  }, opts)

  var provider = new WebSQLProvider(this._opts.dbName, this._opts.dbSize)
  AbstractSQLColorDataStorage.call(this, provider)
}

inherits(ColorDataWebSQLStorage, AbstractSQLColorDataStorage)

ColorDataWebSQLStorage.isAvailable = WebSQLProvider.isAvailable

/**
 * @return {string}
 */
ColorDataWebSQLStorage.prototype.inspect = function () {
  return '<storage.data.ColorDataWebSQLStorage ' + this._opts.dbName + '>'
}

module.exports = ColorDataWebSQLStorage
