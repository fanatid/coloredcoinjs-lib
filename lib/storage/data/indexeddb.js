var _ = require('lodash')
var inherits = require('util').inherits

var IndexedDBProvider = require('../providers/indexeddb')
var AbstractSyncColorDataStorage = require('./abstractsync')

/**
 * @class ColorDataIndexedDBStorage
 * @extends AbstractSyncColorDataStorage
 *
 * @param {Object} [opts]
 * @param {string} [opts.dbName]
 */
function ColorDataIndexedDBStorage (opts) {
  this._opts = _.extend({
    dbName: 'cclib-data'
  }, opts)

  var provider = new IndexedDBProvider(this._opts.dbName)
  AbstractSyncColorDataStorage.call(this, provider)
}

inherits(ColorDataIndexedDBStorage, AbstractSyncColorDataStorage)

ColorDataIndexedDBStorage.isAvailable = IndexedDBProvider.isAvailable

module.exports = ColorDataIndexedDBStorage
