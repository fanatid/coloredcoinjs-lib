var inherits = require('util').inherits

var MemoryProvider = require('../providers/memory')
var AbstractSyncColorDefinitionStorage = require('./abstractsync')

/**
 * @class ColorDefinitionMemoryStorage
 * @extends AbstractSyncColorDefinitionStorage
 */
function ColorDefinitionMemoryStorage () {
  if (!(this instanceof ColorDefinitionMemoryStorage)) {
    return new ColorDefinitionMemoryStorage()
  }

  var storage = new MemoryProvider()
  AbstractSyncColorDefinitionStorage.call(this, storage)
}

inherits(ColorDefinitionMemoryStorage, AbstractSyncColorDefinitionStorage)

/**
 * @return {boolean}
 */
ColorDefinitionMemoryStorage.isAvailable = function () {
  return true
}

module.exports = ColorDefinitionMemoryStorage
