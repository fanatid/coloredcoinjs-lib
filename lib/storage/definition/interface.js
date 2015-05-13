/* globals Promise:true */
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
 * @param {string} desc
 * @return {Promise.<IDefinitionStorage~Record>}
 */
IDefinitionStorage.prototype.add = function () {
  return Promise.reject(
    new errors.NotImplementedError('IDefinitionStorage.add'))
}

/**
 * @param {Object} [opts]
 * @param {number} [opts.id]
 * @param {string} [opts.desc]
 * @return {Promise.<IDefinitionStorage~Record[]>}
 */
IDefinitionStorage.prototype.get = function (opts) {
  return Promise.reject(
    new errors.NotImplementedError('IDefinitionStorage.get'))
}

/**
 * @return {Promise}
 */
IDefinitionStorage.prototype.clear = function () {
  return Promise.reject(
    new errors.NotImplementedError('IDefinitionStorage.clear'))
}

module.exports = IDefinitionStorage
