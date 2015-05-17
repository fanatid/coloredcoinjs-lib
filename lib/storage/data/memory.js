var inherits = require('util').inherits

var MemoryProvider = require('../providers/memory')
var AbstractSyncColorDataStorage = require('./abstractsync')

/**
 * @class ColorDataMemoryStorage
 * @extends AbstractSyncColorDataStorage
 */
function ColorDataMemoryStorage () {
  var provider = new MemoryProvider()
  AbstractSyncColorDataStorage.call(this, provider)
}

inherits(ColorDataMemoryStorage, AbstractSyncColorDataStorage)

ColorDataMemoryStorage.isAvailable = MemoryProvider.isAvailable

/**
 * @return {string}
 */
ColorDataMemoryStorage.prototype.inspect = function () {
  return '<storage.data.ColorDataMemoryStorage>'
}

module.exports = ColorDataMemoryStorage
