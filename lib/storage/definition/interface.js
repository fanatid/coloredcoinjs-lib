/* globals Promise:true */
var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')

var AbstractStorage = require('../abstract')
var errors = require('../../errors')

/**
 * @typedef {Object} IDefinitionStorage~Record
 * @property {number} id
 * @property {string} desc
 */

/**
 * @class IDefinitionStorage
 * @extends AbstractStorage
 */
function IDefinitionStorage () {
  AbstractStorage.call(this)
}

inherits(IDefinitionStorage, AbstractStorage)

/**
 * @callback IDefinitionStorage~addCallback
 * @param {?Error} error
 * @param {IDefinitionStorage~Record} record
 */

/**
 * @param {string} desc
 * @param {IDefinitionStorage~addCallback} callback
 * @return {Promise.<IDefinitionStorage~Record>}
 */
IDefinitionStorage.prototype.add = function (desc, callback) {
  var err = new errors.NotImplementedError('IDefinitionStorage.add')
  return Promise.reject(err).asCallback(callback)
}

/**
 * @callback IDefinitionStorage~getCallback
 * @param {?Error} error
 * @param {IDefinitionStorage~Record[]} records
 */

/**
 * @param {Object} [opts]
 * @param {number} [opts.id]
 * @param {string} [opts.desc]
 * @param {IDefinitionStorage~getCallback} callback
 * @return {Promise.<IDefinitionStorage~Record[]>}
 */
IDefinitionStorage.prototype.get = function (opts, callback) {
  if (_.isFunction(opts) && callback === undefined) {
    callback = opts
  }

  var err = new errors.NotImplementedError('IDefinitionStorage.get')
  return Promise.reject(err).asCallback(callback)
}

/**
 * @callback IDefinitionStorage~clearCallback
 * @param {?Error} error
 */

/**
 * @param {IDefinitionStorage~clearCallback} callback
 * @return {Promise}
 */
IDefinitionStorage.prototype.clear = function (callback) {
  var err = new errors.NotImplementedError('IDefinitionStorage.clear')
  return Promise.reject(err).asCallback(callback)
}

module.exports = IDefinitionStorage
