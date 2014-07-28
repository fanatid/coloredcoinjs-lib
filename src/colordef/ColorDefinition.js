var assert = require('assert')

var _ = require('underscore')

/**
 * Represents a color definition scheme. This means how color exists and
 *  is transferred in the blockchain
 *
 * @class ColorDefinition
 *
 * @param {Object} data
 * @param {number} data.colorId ColorDefinition unique id
 * @param {Object} [data.meta] Meta information for ColorDefinition
 */
function ColorDefinition(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isNumber(data.colorId), 'Expected number data.colorId, got ' + data.colorId)
  assert(_.isObject(data.meta) || _.isUndefined(data.meta), 'Expected Object data.meta, got ' + data.meta)

  this.colorId = data.colorId
  this.meta = data.meta || {}
}

/**
 * Return colorId
 *
 * @return {number}
 */
ColorDefinition.prototype.getColorId = function() {
  return this.colorId
}

/**
 * Return meta
 *
 * @return {Object}
 */
ColorDefinition.prototype.getMeta = function() {
  return this.meta
}


module.exports = ColorDefinition
