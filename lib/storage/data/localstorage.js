var _ = require('lodash')
var inherits = require('util').inherits

var LocalStorageProvider = require('../providers').LocalStorage
var AbstractSyncColorDataStorage = require('./abstractsync')

/**
 * @class ColorDataLocalStorage
 * @extends AbstractSyncColorDataStorage
 *
 * @param {Object} [opts]
 * @param {string} [opts.prefix=cclib-data]
 */
function ColorDataLocalStorage (opts) {
  opts = _.extend({
    prefix: 'cclib-data'
  }, opts)

  var provider = new LocalStorageProvider(opts.prefix)
  AbstractSyncColorDataStorage.call(this, provider)
}

inherits(ColorDataLocalStorage, AbstractSyncColorDataStorage)

ColorDataLocalStorage.isAvailable = LocalStorageProvider.isAvailable

module.exports = ColorDataLocalStorage
