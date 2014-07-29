var assert = require('assert')
var inherits = require('util').inherits

var _ = require('underscore')

var DataStore = require('./DataStore')

/**
 * @class ConfigStore
 *
 * Inherits DataStore
 */
function ConfigStore() {
  DataStore.apply(this, Array.prototype.slice.call(arguments))

  this.configDBKey = DataStore.globalPrefix + 'config'
  /* test-code */
  this.configDBKey = this.configDBKey + '_tests'
  /* end-test-code */

  if (!_.isObject(this.store.get(this.configDBKey)))
    this.store.set(this.configDBKey, {})
}

inherits(ConfigStore, DataStore)

/**
 * Set config object
 *
 * @param {object} config
 */
ConfigStore.prototype.set = function(config) {
  assert(_.isObject(config), 'Expected Object config, got ' + config)

  this.store.set(this.configDBKey, config)
}

/**
 * Get config object from storage
 *
 * @return {Object}
 */
ConfigStore.prototype.get = function() {
  return (this.store.get(this.configDBKey) || {})
}

/**
 * Drop current config
 */
ConfigStore.prototype.clear = function() {
  this.store.remove(this.configDBKey)
}


module.exports = ConfigStore
