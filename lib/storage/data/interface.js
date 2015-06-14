'use strict'

var Promise = require('bluebird')
var ReadyMixin = require('ready-mixin')(Promise)

var errors = require('../../errors')

/**
 * @typedef {Object} IDataStorage~Record
 * @property {string} colorCode
 * @property {string} txid
 * @property {number} oidx
 * @property {number} colorId
 * @property {*} value
 */

/**
 * @class IDataStorage
 * @mixes ReadyMixin
 */
function IDataStorage () {}

ReadyMixin(IDataStorage.prototype)

/**
 * @return {boolean}
 */
IDataStorage.isAvailable = function () { return false }

/**
 * @param {IDataStorage~Record} data
 * @return {Promise}
 */
IDataStorage.prototype.add = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.add'))
}

/**
 * @param {Object} opts
 * @param {string} opts.colorCode
 * @param {string} opts.txid
 * @param {number} [opts.oidx]
 * @return {Promise.<Object>}
 */
IDataStorage.prototype.get = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.get'))
}

/**
 * @param {Object} opts
 * @param {string} opts.colorCode
 * @param {string} opts.txid
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
