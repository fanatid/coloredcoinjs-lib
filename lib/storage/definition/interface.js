/* globals Promise:true */
var inherits = require('util').inherits
var Promise = require('bluebird')

var errors = require('../../errors')
var AbstractStorage = require('../abstract')

/**
 * @typedef {Object} IColorDefinitionStorage~Record
 * @property {number} id
 * @property {string} desc
 */

/**
 * @class IColorDefinitionStorage
 * @extends AbstractStorage
 */
function IColorDefinitionStorage () {
  if (!(this instanceof IColorDefinitionStorage)) {
    return new IColorDefinitionStorage()
  }

  AbstractStorage.call(this)
}

inherits(IColorDefinitionStorage, AbstractStorage)

/**
 * @return {boolean}
 */
IColorDefinitionStorage.isAvailable = function isAvailable () { return false }

/**
 * @param {string} desc
 * @param {boolean} [autoAdd=true]
 * @return {Promise.<?IColorDefinitionStorage~Record>}
 */
IColorDefinitionStorage.prototype.resolve = function resolve () {
  return Promise.reject(
    new errors.NotImplementedError('IColorDefinitionStorage.resolve'))
}

/**
 * @param {number} id
 * @return {Promise.<IColorDefinitionStorage~Record[]>}
 */
IColorDefinitionStorage.prototype.getByColorId = function getByColorId () {
  return Promise.reject(
    new errors.NotImplementedError('IColorDefinitionStorage.getByColorId'))
}

/**
 * @return {Promise}
 */
IColorDefinitionStorage.prototype.clear = function clear () {
  return Promise.reject(
    new errors.NotImplementedError('IColorDefinitionStorage.clear'))
}

module.exports = IColorDefinitionStorage
