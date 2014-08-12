var assert = require('assert')

var _ = require('lodash')

global.localStorage = require('localStorage')
var store = require('store')


/**
 * @class SyncStorage
 *
 * @param {Object} [opts]
 * @param {string} [opts.globalPrefix=cc_]
 */
function SyncStorage(opts) {
  opts = _.isUndefined(opts) ? {} : opts

  assert(_.isObject(opts), 'Expected Object opts, got ' + opts)
  assert(_.isUndefined(opts.globalPrefix) || _.isString(opts.globalPrefix),
    'Expected string opts.globalPrefix, got ' + opts.globalPrefix)

  this.globalPrefix = 'cc_'
  if (_.isString(opts.globalPrefix))
    this.globalPrefix = opts.globalPrefix


  if (store.disabled)
    throw new Error('localStorage is not supported!')
  this.store = store
}


module.exports = SyncStorage
