var assert = require('assert')
var inherits = require('util').inherits

var _ = require('underscore')

var DataStore = require('./DataStore')

/**
 * @class ConfigDataStore
 *
 * Inherits DataStore
 */
function ConfigDataStore() {
  DataStore.apply(this, Array.prototype.slice.call(arguments))

  this.configDBKey = DataStore.globalPrefix + 'config'
  /* test-code */
  this.configDBKey = this.configDBKey + '_tests'
  /* end-test-code */

  if (!_.isObject(this.store.get(this.configDBKey)))
    this.store.set(this.configDBKey, {})
}

inherits(ConfigDataStore, DataStore)

/**
 * Set config object
 *
 * @param {object} config
 */
ConfigDataStore.prototype.set = function(config) {
  assert(_.isObject(config), 'Expected Object config, got ' + config)

  this.store.set(this.configDBKey, config)
}

/**
 * Get config object from storage
 *
 * @return {Object}
 */
ConfigDataStore.prototype.get = function() {
  return (this.store.get(this.configDBKey) || {})
}

/**
 * Drop current config
 */
ConfigDataStore.prototype.clear = function() {
  this.store.remove(this.configDBKey)
}


module.exports = ConfigDataStore
