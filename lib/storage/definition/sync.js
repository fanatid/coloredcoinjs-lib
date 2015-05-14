/* globals Promise:true */
var inherits = require('util').inherits
var Promise = require('bluebird')
var makeConcurrent = require('make-concurrent')(Promise)

var IColorDefinitionStorage = require('./interface')

/**
 * @class ColorDefinitionSyncStorage
 * @extends IColorDefinitionStorage
 *
 * @param {Object} storage
 */
function ColorDefinitionSyncStorage (storage) {
  if (!(this instanceof ColorDefinitionSyncStorage)) {
    return new ColorDefinitionSyncStorage(storage)
  }

  this._storage = storage
  IColorDefinitionStorage.call(this)

  this._setReady()
}

inherits(ColorDefinitionSyncStorage, IColorDefinitionStorage)

/**
 * @param {string} desc
 * @param {boolean} [autoAdd=true]
 * @return {Promise.<?IColorDefinitionStorage~Record>}
 */
ColorDefinitionSyncStorage.prototype.resolve = makeConcurrent(function resolve (desc, autoAdd) {

})

/**
 * @param {number} id
 * @return {Promise.<IColorDefinitionStorage~Record[]>}
 */
ColorDefinitionSyncStorage.prototype.getByColorId = function getByColorId () {
}

/**
 * @return {Promise}
 */
ColorDefinitionSyncStorage.prototype.clear = function clear () {
  var self = this
  return Promise.try(function () {
    self._storage.clear()
  })
}

module.exports = ColorDefinitionSyncStorage
