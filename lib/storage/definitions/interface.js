/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)

var errors = require('../../errors')

/**
 * @typedef {Object} IColorDefinitionStorage~Record
 * @property {number} id
 * @property {string} desc
 */

/**
 * @class IColorDefinitionStorage
 */
function IColorDefinitionStorage () {}

readyMixin(IColorDefinitionStorage.prototype)

/**
 * @return {boolean}
 */
IColorDefinitionStorage.isAvailable = function () { return false }

/**
 * @param {string} desc
 * @param {boolean} [autoAdd=true]
 * @return {Promise.<?IColorDefinitionStorage~Record>}
 */
IColorDefinitionStorage.prototype.resolve = function () {
  return Promise.reject(
    new errors.NotImplementedError(this.constructor.name + '.resolve'))
}

/**
 * @param {number} [id]
 * @return {Promise.<(
 *   ?IColorDefinitionStorage~Record|
 *   IColorDefinitionStorage~Record[]
 * )>}
 */
IColorDefinitionStorage.prototype.get = function () {
  return Promise.reject(
    new errors.NotImplementedError(this.constructor.name + '.get'))
}

/**
 * @return {Promise}
 */
IColorDefinitionStorage.prototype.clear = function () {
  return Promise.reject(
    new errors.NotImplementedError(this.constructor.name + '.clear'))
}

/**
 * @return {string}
 */
IColorDefinitionStorage.prototype.inspect = function () {
  return '<storage.definitions.IColorDefinitionStorage>'
}

module.exports = IColorDefinitionStorage
