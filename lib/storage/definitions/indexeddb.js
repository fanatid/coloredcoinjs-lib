'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var IndexedDBStorage = require('odd-storage')(Promise).IndexedDB

var AbstractSyncColorDefinitionStorage = require('./abstractsync')

/**
 * @class ColorDefinitionIndexedDBStorage
 * @extends AbstractSyncColorDefinitionStorage
 * @param {Object} [opts]
 * @param {string} [opts.dbName=cclib-definitions]
 */
function ColorDefinitionIndexedDBStorage (opts) {
  opts = _.extend({dbName: 'cclib-definitions'}, opts)
  this._storage = new IndexedDBStorage(opts)

  AbstractSyncColorDefinitionStorage.call(this)
}

inherits(ColorDefinitionIndexedDBStorage, AbstractSyncColorDefinitionStorage)
_.extend(ColorDefinitionIndexedDBStorage, AbstractSyncColorDefinitionStorage)

ColorDefinitionIndexedDBStorage.isAvailable = IndexedDBStorage.isAvailable

module.exports = ColorDefinitionIndexedDBStorage
