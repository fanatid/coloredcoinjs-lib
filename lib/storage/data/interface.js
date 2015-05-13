/* globals Promise:true */
var Promise = require('bluebird')

var errors = require('../../errors')

/**
 * @typedef {Object} AbstractColorDataStorage~Record
 * @property {number} colorId
 * @property {string} txId
 * @property {number} outIndex
 * @property {number} value
 */

/* @todo Add ready event */

/**
 * @class AbstractColorDataStorage
 */
function AbstractColorDataStorage () {}

/**
 * @param {Object} data
 * @param {number} data.colorId
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @param {number} data.value
 * @return {Promise.<AbstractColorDataStorage~Record>}
 */
AbstractColorDataStorage.prototype.add = function () {
  return Promise.reject(
    new errors.NotImplementedError('AbstractColorDataStorage.add'))
}

/**
 * @param {Object} data
 * @param {number} data.colorId
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @return {Promise.<?number>}
 */
AbstractColorDataStorage.prototype.getColorValue = function () {
  return Promise.reject(
    new errors.NotImplementedError('AbstractColorDataStorage.getColorValue'))
}

/**
 * @param {Object} data
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @return {Promise.<boolean>}
 */
AbstractColorDataStorage.prototype.isColoredOutput = function () {
  return Promise.reject(
    new errors.NotImplementedError('AbstractColorDataStorage.isColoredOutput'))
}

/**
 * @param {Object} data
 * @param {number} [data.colorId]
 * @param {string} [data.txId]
 * @param {number} [data.outIndex]
 * @return {Promise}
 */
AbstractColorDataStorage.prototype.remove = function () {
  return Promise.reject(
    new errors.NotImplementedError('AbstractColorDataStorage.remove'))
}

/**
 * @return {Promise}
 */
AbstractColorDataStorage.prototype.clear = function () {
  return Promise.reject(
    new errors.NotImplementedError('AbstractColorDataStorage.clear'))
}

module.exports = AbstractColorDataStorage
