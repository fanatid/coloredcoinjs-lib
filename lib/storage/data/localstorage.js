'use strict'

var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var LocalStorage = require('odd-storage')(Promise).LocalStorage

var AbstractSyncColorDataStorage = require('./abstractsync')

/**
 * @class ColorDataLocalStorage
 * @extends AbstractSyncColorDataStorage
 * @param {Object} [opts]
 * @param {string} [opts.prefix=cclib-data]
 */
function ColorDataLocalStorage (opts) {
  opts = _.extend({prefix: 'cclib-data'}, opts)
  this._storage = new LocalStorage(opts)

  AbstractSyncColorDataStorage.call(this)
}

inherits(ColorDataLocalStorage, AbstractSyncColorDataStorage)
_.extend(ColorDataLocalStorage, AbstractSyncColorDataStorage)

ColorDataLocalStorage.isAvailable = LocalStorage.isAvailable

module.exports = ColorDataLocalStorage
