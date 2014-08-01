var assert = require('assert')
var inherits = require('util').inherits

var _ = require('lodash')

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
 * Set key
 *
 * @param {string} key
 * @param {} value
 */
ConfigStore.prototype.set = function(key, value) {
  assert(_.isString(key), 'Expected String key, got ' + key)

  var config = this.store.get(this.configDBKey) || {}

  config[key] = value

  this.store.set(this.configDBKey, config)
}

/**
 * Get key from store or defaultValue if value undefined
 *
 * @param {string} key
 * @param {} [defaultValue=undefined]
 * @return {}
 */
ConfigStore.prototype.get = function(key, defaultValue) {
  var config = this.store.get(this.configDBKey) || {}
  var value = _.isUndefined(config[key]) ? defaultValue : config[key]
  return value
}

/**
 * Drop current config
 */
ConfigStore.prototype.clear = function() {
  this.store.remove(this.configDBKey)
}


module.exports = ConfigStore
