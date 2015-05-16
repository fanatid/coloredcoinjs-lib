var inherits = require('util').inherits

var MemoryProvider = require('../providers/memory')
var AbstractSyncColorDefinitionStorage = require('./abstractsync')

/**
 * @class ColorDefinitionMemoryStorage
 * @extends AbstractSyncColorDefinitionStorage
 */
function ColorDefinitionMemoryStorage () {
  var storage = new MemoryProvider()
  AbstractSyncColorDefinitionStorage.call(this, storage)
}

inherits(ColorDefinitionMemoryStorage, AbstractSyncColorDefinitionStorage)

ColorDefinitionMemoryStorage.isAvailable = MemoryProvider.isAvailable

module.exports = ColorDefinitionMemoryStorage
