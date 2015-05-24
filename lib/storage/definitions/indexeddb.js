var _ = require('lodash')
var inherits = require('util').inherits

var IndexedDBProvider = require('../providers/indexeddb')
var AbstractSyncColorDefinitionStorage = require('./abstractsync')

/**
 * @class ColorDefinitionIndexedDBStorage
 * @extends AbstractSyncColorDefinitionStorage
 *
 * @param {Object} [opts]
 * @param {string} [opts.dbName]
 */
function ColorDefinitionIndexedDBStorage (opts) {
  this._opts = _.extend({
    dbName: 'cclib-definitions'
  }, opts)

  var provider = new IndexedDBProvider(this._opts.dbName)
  AbstractSyncColorDefinitionStorage.call(this, provider)
}

inherits(ColorDefinitionIndexedDBStorage, AbstractSyncColorDefinitionStorage)

ColorDefinitionIndexedDBStorage.isAvailable = IndexedDBProvider.isAvailable

module.exports = ColorDefinitionIndexedDBStorage
