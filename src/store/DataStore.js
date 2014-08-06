var assert = require('assert')

var _ = require('lodash')

global.localStorage = require('localStorage')
var store = require('store')


/**
 * @class DataStore
 *
 * @param {Object} [opts]
 * @param {string} [opts.globalPrefix=cc_]
 * @param {boolean} [opts.testnet=false]
 * @param {boolean} [opts.testEnv=false]
 */
function DataStore(opts) {
  opts = _.isUndefined(opts) ? {} : opts

  assert(_.isObject(opts), 'Expected Object opts, got ' + opts)
  assert(_.isUndefined(opts.globalPrefix) || _.isString(opts.globalPrefix),
    'Expected string opts.globalPrefix, got ' + opts.globalPrefix)
  assert(_.isUndefined(opts.testnet) || _.isBoolean(opts.testnet),
    'Expected boolean opts.testnet, got ' + opts.testnet)
  assert(_.isUndefined(opts.testEnv) || _.isBoolean(opts.testEnv),
    'Expected boolean opts.testEnv, got ' + opts.testEnv)

  this.globalPrefix = 'cc_'
  if (_.isString(opts.globalPrefix))
    this.globalPrefix = opts.globalPrefix

  if (opts.testnet)
    this.globalPrefix += 'testnet_'

  if (opts.testEnv)
    this.globalPrefix += 'tests_'


  if (store.disabled)
    throw new Error('localStorage is not supported!')
  this.store = store
}

DataStore.globalPrefix = 'cc_'


module.exports = DataStore
