/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)

var errors = require('../../errors')

/**
 * @typedef {Object} AbstractColorDefinitionStorage~Record
 * @property {number} id
 * @property {string} desc
 */

/**
 * @class AbstractColorDefinitionStorage
 */
function AbstractColorDefinitionStorage () {
  if (!(this instanceof AbstractColorDefinitionStorage)) {
    return new AbstractColorDefinitionStorage()
  }
}

readyMixin(AbstractColorDefinitionStorage.prototype)

/**
 * @return {boolean}
 */
AbstractColorDefinitionStorage.isAvailable = function () { return false }

/**
 * @param {string} desc
 * @param {boolean} [autoAdd=true]
 * @return {Promise.<?AbstractColorDefinitionStorage~Record>}
 */
AbstractColorDefinitionStorage.prototype.resolve = function () {
  return Promise.reject(
    new errors.NotImplementedError(this.constructor.name + '.resolve'))
}

/**
 * @param {number} [id]
 * @return {Promise.<(
 *   ?AbstractColorDefinitionStorage~Record|
 *   AbstractColorDefinitionStorage~Record[]
 * )>}
 */
AbstractColorDefinitionStorage.prototype.get = function () {
  return Promise.reject(
    new errors.NotImplementedError(this.constructor.name + '.get'))
}

/**
 * @return {Promise}
 */
AbstractColorDefinitionStorage.prototype.clear = function () {
  return Promise.reject(
    new errors.NotImplementedError(this.constructor.name + '.clear'))
}

module.exports = AbstractColorDefinitionStorage
