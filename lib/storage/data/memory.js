'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var MemoryStorage = require('odd-storage')(Promise).Memory

var AbstractSyncColorDataStorage = require('./abstractsync')

/**
 * @class ColorDataMemoryStorage
 * @extends AbstractSyncColorDataStorage
 */
function ColorDataMemoryStorage () {
  this._storage = new MemoryStorage()

  AbstractSyncColorDataStorage.call(this)
}

inherits(ColorDataMemoryStorage, AbstractSyncColorDataStorage)
_.extend(ColorDataMemoryStorage, AbstractSyncColorDataStorage)

ColorDataMemoryStorage.isAvailable = MemoryStorage.isAvailable

module.exports = ColorDataMemoryStorage
