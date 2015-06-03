/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)

var errors = require('../../errors')

/**
 * @typedef {Object} IDataStorage~Record
 * @property {string} txid
 * @property {number} oidx
 * @property {number} colorId
 * @property {number} value
 */

/**
 * @class IDataStorage
 */
function IDataStorage () {}

readyMixin(IDataStorage.prototype)

/**
 * @return {boolean}
 */
IDataStorage.isAvailable = function () { return false }

/**
 * @param {IDataStorage~Record} data
 * @return {Promise.<IDataStorage~Record>}
 */
IDataStorage.prototype.add = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.add'))
}

/**
 * @param {Object} opts
 * @param {string} opts.txid
 * @param {number} [opts.oidx]
 * @param {number} [opts.colorId]
 * @return {Promise.<(Object|?number)>}
 */
IDataStorage.prototype.get = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.get'))
}

/**
 * @param {string} txid
 * @return {Promise}
 */
IDataStorage.prototype.remove = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.remove'))
}

/**
 * @return {Promise}
 */
IDataStorage.prototype.clear = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.clear'))
}

module.exports = IDataStorage
