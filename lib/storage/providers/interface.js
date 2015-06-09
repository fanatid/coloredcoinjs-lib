var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)
var makeConcurrent = require('make-concurrent')(Promise)

var errors = require('../../errors')

/**
 * @class IStorageProvider
 */
function IStorageProvider () {}

readyMixin(IStorageProvider.prototype)

/**
 * @return {boolean}
 */
IStorageProvider.isAvailable = function () { return false }

/**
 * @return {string}
 */
IStorageProvider.prototype.getDBName = function () {
  throw new errors.NotImplemented(this.constructor.name + '.getDBName')
}

/**
 * @return {Promise}
 */
IStorageProvider.prototype.open = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.open'))
}

/**
 */
IStorageProvider.prototype._isOpenedCheckPromise = function () {
  if (!this.isReady()) {
    return Promise.reject(new errors.Storage.UnopenedYet())
  }

  return Promise.resolve()
}

/**
 * @callback IStorageProvider~transactionCallback
 */

/**
 * @param {IStorageProvider~transactionCallback} fn
 * @return {Promise}
 */
IStorageProvider.prototype.transaction = makeConcurrent(function (fn) {
  return this._isOpenedCheckPromise().then(fn)
}, {concurrency: 1})

/**
 * @param {string} sql
 * @param {Array.<*>} [args]
 * @return {Promise}
 */
IStorageProvider.prototype.executeSQL = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.executeSQL'))
}

/**
 * @param {string} key
 * @param {string} value
 * @return {Promise}
 */
IStorageProvider.prototype.set = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.set'))
}

/**
 * @param {string} key
 * @return {Promise.<?string>}
 */
IStorageProvider.prototype.get = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.get'))
}

/**
 * @param {string} key
 * @return {Promise}
 */
IStorageProvider.prototype.remove = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.remove'))
}

/**
 * @callback IStorageProvider~iterateCallback
 * @param {string} key
 * @param {string} value
 */

/**
 * @param {IStorageProvider~iterateCallback} callback
 * @return {Promise}
 */
IStorageProvider.prototype.iterate = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.iterate'))
}

/**
 * @return {Promise}
 */
IStorageProvider.prototype.clear = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.clear'))
}

module.exports = IStorageProvider
