/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)

var errors = require('../../errors')

/**
 * @typedef {Object} IDataStorage~Record
 * @property {string} txid
 * @property {number} vout
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
    new errors.NotImplemented('IDataStorage.add'))
}

/**
 * @param {Object} opts
 * @param {string} opts.txid
 * @param {number} [opts.vout]
 * @param {number} [opts.colorId]
 * @return {Promise.<(Object|?number)>}
 */
IDataStorage.prototype.get = function () {
  return Promise.reject(
    new errors.NotImplemented('IDataStorage.get'))
}

/**
 * @param {string} txid
 * @return {Promise}
 */
IDataStorage.prototype.remove = function () {
  return Promise.reject(
    new errors.NotImplemented('IDataStorage.remove'))
}

/**
 * @return {Promise}
 */
IDataStorage.prototype.clear = function () {
  return Promise.reject(
    new errors.NotImplemented('IDataStorage.clear'))
}

module.exports = IDataStorage
