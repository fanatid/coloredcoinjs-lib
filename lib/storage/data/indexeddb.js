'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var IndexedDBStorage = require('odd-storage')(Promise).IndexedDB

var AbstractSyncColorDataStorage = require('./abstractsync')

/**
 * @class ColorDataIndexedDBStorage
 * @extends AbstractSyncColorDataStorage
 * @param {Object} [opts]
 * @param {string} [opts.dbName]
 */
function ColorDataIndexedDBStorage (opts) {
  opts = _.extend({dbName: 'cclib-data'}, opts)
  this._storage = new IndexedDBStorage(opts)

  AbstractSyncColorDataStorage.call(this)
}

inherits(ColorDataIndexedDBStorage, AbstractSyncColorDataStorage)
_.extend(ColorDataIndexedDBStorage, AbstractSyncColorDataStorage)

ColorDataIndexedDBStorage.isAvailable = IndexedDBStorage.isAvailable

module.exports = ColorDataIndexedDBStorage
