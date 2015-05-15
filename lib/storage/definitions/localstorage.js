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
  if (!(this instanceof ColorDefinitionLocalStorage)) {
    return new ColorDefinitionLocalStorage(opts)
  }

  opts = _.extend({
    prefix: 'cclib-definitions'
  }, opts)

  var storage = new LocalStorageProvider(opts.prefix)
  AbstractSyncColorDefinitionStorage.call(this, storage)
}

inherits(ColorDefinitionLocalStorage, AbstractSyncColorDefinitionStorage)

/**
 * @return {boolean}
 */
ColorDefinitionLocalStorage.isAvailable = function () {
  if (_.isObject(global.localStorage) &&
      _.isFunction(global.localStorage.getItem) &&
      _.isFunction(global.localStorage.setItem) &&
      _.isFunction(global.localStorage.clear)) {
    return true
  }

  try {
    return 'localStorage' in window && _.isObject(window.localStorage)
  } catch (err) {
    return false
  }
}

module.exports = ColorDefinitionLocalStorage
