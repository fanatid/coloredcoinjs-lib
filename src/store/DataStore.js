var assert = require('assert')
var _ = require('underscore')

var errors = require('./errors')


/**
 * @class DataStore
 *
 * @param {string} type DB type, now available only memory
 * @param {Object} opts DB options
 */
function DataStore(type, opts) {
  opts = opts || {}

  assert(_.isString(type), 'Expected string type, got ' + type)
  assert(_.isObject(opts), 'Expected object type, got ' + opts)

  this._dbType = type

  if (type === 'memory') {
    this._db = {}

  } else {
    throw new errors.UnknownTypeDBError('Expected type in ["memory"], got ' + type)

  }
}


module.exports = DataStore
