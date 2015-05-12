/* globals Promise:true */
var Promise = require('bluebird')

var errors = require('../../errors')

/**
 * @typedef {Object} AbstractColorDefinitionStorage~Record
 * @property {number} id
 * @property {string} desc
 */

/**
 * @class AbstractColorDefinitionStorage
 */
function AbstractColorDefinitionStorage () {}

/**
 * @param {string} desc
 * @return {Promise.<AbstractColorDefinitionStorage~Record>}
 */
AbstractColorDefinitionStorage.prototype.add = function () {
  return Promise.reject(
    new errors.NotImplementedError('AbstractColorDefinitionStorage.add'))
}

/**
 * @param {Object} [opts]
 * @param {number} [opts.id]
 * @param {string} [opts.desc]
 * @return {Promise.<AbstractColorDefinitionStorage~Record[]>}
 */
AbstractColorDefinitionStorage.prototype.get = function () {
  return Promise.reject(
    new errors.NotImplementedError('AbstractColorDefinitionStorage.get'))
}

/**
 * @return {Promise}
 */
AbstractColorDefinitionStorage.prototype.clear = function () {
  return Promise.reject(
    new errors.NotImplementedError('AbstractColorDefinitionStorage.clear'))
}

module.exports = AbstractColorDefinitionStorage
