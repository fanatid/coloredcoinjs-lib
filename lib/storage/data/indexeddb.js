var _ = require('lodash')
var inherits = require('util').inherits

var IndexedDBProvider = require('../providers').IndexedDB
var AbstractSyncColorDataStorage = require('./abstractsync')

/**
 * @class ColorDataIndexedDBStorage
 * @extends AbstractSyncColorDataStorage
 * @param {Object} [opts]
 * @param {string} [opts.dbName]
 */
function ColorDataIndexedDBStorage (opts) {
  opts = _.extend({dbName: 'cclib-data'}, opts)
  this._storage = new IndexedDBProvider(opts.dbName)

  AbstractSyncColorDataStorage.call(this)
}

inherits(ColorDataIndexedDBStorage, AbstractSyncColorDataStorage)
_.extend(ColorDataIndexedDBStorage, AbstractSyncColorDataStorage)

ColorDataIndexedDBStorage.isAvailable = IndexedDBProvider.isAvailable

module.exports = ColorDataIndexedDBStorage
