var _ = require('lodash')
var inherits = require('util').inherits

var MemoryProvider = require('../providers').Memory
var AbstractSyncColorDataStorage = require('./abstractsync')

/**
 * @class ColorDataMemoryStorage
 * @extends AbstractSyncColorDataStorage
 */
function ColorDataMemoryStorage () {
  this._storage = new MemoryProvider()

  AbstractSyncColorDataStorage.call(this)
}

inherits(ColorDataMemoryStorage, AbstractSyncColorDataStorage)
_.extend(ColorDataMemoryStorage, AbstractSyncColorDataStorage)

ColorDataMemoryStorage.isAvailable = MemoryProvider.isAvailable

module.exports = ColorDataMemoryStorage
