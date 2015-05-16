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
  opts = _.extend({
    dbName: 'cclib-definitions'
  }, opts)

  var storage = new IndexedDBProvider(opts.dbName)
  AbstractSyncColorDefinitionStorage.call(this, storage)
}

inherits(ColorDefinitionIndexedDBStorage, AbstractSyncColorDefinitionStorage)

ColorDefinitionIndexedDBStorage.isAvailable = IndexedDBProvider.isAvailable

module.exports = ColorDefinitionIndexedDBStorage
