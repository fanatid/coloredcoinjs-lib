'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var LocalStorage = require('odd-storage')(Promise).LocalStorage

var AbstractSyncColorDefinitionStorage = require('./abstractsync')

/**
 * @class ColorDefinitionLocalStorage
 * @extends AbstractSyncColorDefinitionStorage
 * @param {Object} [opts]
 * @param {string} [opts.prefix=cclib-definitions]
 */
function ColorDefinitionLocalStorage (opts) {
  opts = _.extend({prefix: 'cclib-definitions'}, opts)
  this._storage = new LocalStorage(opts)

  AbstractSyncColorDefinitionStorage.call(this)
}

inherits(ColorDefinitionLocalStorage, AbstractSyncColorDefinitionStorage)
_.extend(ColorDefinitionLocalStorage, AbstractSyncColorDefinitionStorage)

ColorDefinitionLocalStorage.isAvailable = LocalStorage.isAvailable

module.exports = ColorDefinitionLocalStorage
