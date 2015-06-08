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
 * @param {Object} [opts]
 * @param {boolean} [opts.autoAdd=true]
 * @return {Promise.<{record: ?IColorDefinitionStorage~Record, new: ?boolean}>}
 */
IColorDefinitionStorage.prototype.resolve = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.resolve'))
}

/**
 * @param {Object} [opts]
 * @param {number} [opts.id]
 * @return {Promise.<(
 *   ?IColorDefinitionStorage~Record|
 *   IColorDefinitionStorage~Record[]
 * )>}
 */
IColorDefinitionStorage.prototype.get = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.get'))
}

/**
 * @return {Promise}
 */
IColorDefinitionStorage.prototype.clear = function () {
  return Promise.reject(
    new errors.NotImplemented(this.constructor.name + '.clear'))
}

module.exports = IColorDefinitionStorage
