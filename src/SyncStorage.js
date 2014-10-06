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
  opts = _.extend({
    globalPrefix: 'cc_'
  }, opts)

  this.globalPrefix = opts.globalPrefix

  // If localStorage not available, data will be saved into memory
  if (store.disabled)
    console.warn('localStorage is not supported!')

  this.store = store
}


module.exports = SyncStorage
