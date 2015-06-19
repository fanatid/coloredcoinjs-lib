'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var MemoryStorage = require('odd-storage')(Promise).Memory

var AbstractSyncColorDefinitionStorage = require('./abstractsync')

/**
 * @class ColorDefinitionMemoryStorage
 * @extends AbstractSyncColorDefinitionStorage
 */
function ColorDefinitionMemoryStorage () {
  this._storage = new MemoryStorage()

  AbstractSyncColorDefinitionStorage.call(this)
}

inherits(ColorDefinitionMemoryStorage, AbstractSyncColorDefinitionStorage)
_.extend(ColorDefinitionMemoryStorage, AbstractSyncColorDefinitionStorage)

ColorDefinitionMemoryStorage.isAvailable = MemoryStorage.isAvailable

module.exports = ColorDefinitionMemoryStorage
