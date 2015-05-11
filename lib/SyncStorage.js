var _ = require('lodash')

global.localStorage = require('localStorage')
var store = require('store')


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
    store: store,
  }, opts)

  this.globalPrefix = opts.globalPrefix
  this.store = opts.store
}


module.exports = SyncStorage
