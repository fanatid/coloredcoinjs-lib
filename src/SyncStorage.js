var _ = require('lodash')

global.localStorage = require('localStorage')
var store = require('store')

var errors = require('./errors')
var verify = require('./verify')


/**
 * @typedef {Object} AbstarctStorage
 * @param {function} set
 * @param {function} get
 * @param {function} remove
 */

/**
 * @class SyncStorage
 * @param {Object} [opts]
 * @param {string} [opts.globalPrefix=cc_]
 * @param {AbstractStorage} [opts.store=localStorage]
 */
function SyncStorage(opts) {
  opts = _.extend({
    globalPrefix: 'cc_',
    store: store
  }, opts)

  verify.object(opts)
  verify.string(opts.globalPrefix)
  verify.object(opts.store)
  verify.function(opts.store.set)
  verify.function(opts.store.get)
  verify.function(opts.store.remove)

  this.globalPrefix = opts.globalPrefix
  this.store = store
}

/**
 */
SyncStorage.prototype.saveImmediately = function () {
  throw new errors.NotImplementedError('SyncStorage.saveImmediately')
}


module.exports = SyncStorage
