var _ = require('lodash')
var inherits = require('util').inherits

var LocalStorageProvider = require('../providers/localstorage')
var AbstractSyncColorDefinitionStorage = require('./abstractsync')

/**
 * @class ColorDefinitionLocalStorage
 * @extends AbstractSyncColorDefinitionStorage
 *
 * @param {Object} [opts]
 * @param {string} [opts.prefix=cclib-definitions]
 */
function ColorDefinitionLocalStorage (opts) {
  opts = _.extend({
    prefix: 'cclib-definitions'
  }, opts)

  var provider = new LocalStorageProvider(opts.prefix)
  AbstractSyncColorDefinitionStorage.call(this, provider)
}

inherits(ColorDefinitionLocalStorage, AbstractSyncColorDefinitionStorage)

ColorDefinitionLocalStorage.isAvailable = LocalStorageProvider.isAvailable

/**
 * @return {string}
 */
ColorDefinitionLocalStorage.prototype.inspect = function () {
  return '<storage.definitions.ColorDefinitionLocalStorage>'
}

module.exports = ColorDefinitionLocalStorage
