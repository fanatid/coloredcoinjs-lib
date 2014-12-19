var _ = require('lodash')

global.localStorage = require('localStorage')
var store = require('store')

var verify = require('./verify')


/**
 * @callback SyncStorage~AbstractStoreSet
 * @param {string} key
 * @param {*} value
 */

/**
 * @callback SyncStorage~AbstractStoreGet
 * @param {string} key
 * @return {*}
 */

/**
 * @callback SyncStorage~AbstractStoreRemove
 * @param {string} key
 */

/**
 * @typedef {Object} SyncStorage~AbstractStore
 * @property {SyncStorage~AbstractStoreSet} set
 * @property {SyncStorage~AbstractStoreGet} get
 * @property {SyncStorage~AbstractStoreRemove} remove
 */

/**
 * @class SyncStorage
 * @param {Object} [opts]
 * @param {string} [opts.globalPrefix=cc_]
 * @param {SyncStorage~AbstractStore} [opts.store=store]
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


module.exports = SyncStorage
