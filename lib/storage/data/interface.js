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
IDataStorage.prototype.addColorValue = function () {
  return Promise.reject(
    new errors.NotImplementedError('IDataStorage.addColorValue'))
}

/**
 * @param {string} txid
 * @param {number} vout
 * @param {number} [colorId]
 * @return {Promise.<(Object|?number)>}
 */
IDataStorage.prototype.getColorValues = function () {
  return Promise.reject(
    new errors.NotImplementedError('IDataStorage.getColorValues'))
}

/** @todo Remove (unnecessary?) */
/**
 * @param {string} txid
 * @param {number} vout
 * @return {Promise.<boolean>}
 */
IDataStorage.prototype.isColoredOutput = function () {
  return Promise.reject(
    new errors.NotImplementedError('IDataStorage.isColoredOutput'))
}

/**
 * @param {string} txid
 * @param {number} vout
 * @return {Promise}
 */
IDataStorage.prototype.removeOutput = function () {
  return Promise.reject(
    new errors.NotImplementedError('IDataStorage.removeOutput'))
}

/**
 * @return {Promise}
 */
IDataStorage.prototype.clear = function () {
  return Promise.reject(
    new errors.NotImplementedError('IDataStorage.clear'))
}

module.exports = IDataStorage
