/* globals Promise:true */
var inherits = require('util').inherits
var Promise = require('bluebird')

var errors = require('../../errors')
var AbstractStorage = require('../abstract')

/**
 * @typedef {Object} IDataStorage~Record
 * @property {string} txId
 * @property {number} outIndex
 * @property {number} colorId
 * @property {number} value
 */

/**
 * @class IDataStorage
 * @extends AbstractStorage
 */
function IDataStorage () {
  if (!(this instanceof IDataStorage)) {
    return new IDataStorage()
  }

  AbstractStorage.call(this)
}

inherits(IDataStorage, AbstractStorage)

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
    new errors.NotImplementedError('IDataStorage.add'))
}

/**
 * @param {string} txId
 * @param {number} outIndex
 * @return {Promise.<Array.<{colorId: number, value: number}>>}
 */
IDataStorage.prototype.getColorValues = function () {
  return Promise.reject(
    new errors.NotImplementedError('IDataStorage.getColorValues'))
}

/**
 * @param {string} txId
 * @param {number} outIndex
 * @return {Promise.<boolean>}
 */
IDataStorage.prototype.isColoredOutput = function () {
  return Promise.reject(
    new errors.NotImplementedError('IDataStorage.isColoredOutput'))
}

/**
 * @param {string} txId
 * @param {number} outIndex
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
