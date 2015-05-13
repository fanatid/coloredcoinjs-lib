/* globals Promise:true */
var inherits = require('util').inherits

var MemoryProvider = require('../providers/memory')
var ColorDefinitionSyncStorage = require('./sync')

/**
 * @class ColorDefinitionMemoryStorage
 * @extends ColorDefinitionSyncStorage
 */
function ColorDefinitionMemoryStorage () {
  if (!(this instanceof ColorDefinitionMemoryStorage)) {
    return new ColorDefinitionMemoryStorage()
  }

  var storage = new MemoryProvider()
  ColorDefinitionSyncStorage.call(this, storage)
}

inherits(ColorDefinitionMemoryStorage, ColorDefinitionSyncStorage)

/**
 * @return {boolean}
 */
ColorDefinitionMemoryStorage.isAvailable = function isAvailable () {
  return true
}

module.exports = ColorDefinitionMemoryStorage
