var assert = require('assert')

var _ = require('underscore')

/**
 * Represents a color definition scheme. This means how color exists and
 *  is transferred in the blockchain
 *
 * @class ColorDefinition
 *
 * @param {number} colorId
 */
function ColorDefinition(colorId) {
  assert(_.isNumber(colorId), 'Expected number colorId, got ' + colorId)

  this.colorId = colorId
}

/**
 * @return {number}
 */
ColorDefinition.prototype.getColorId = function() {
  return this.colorId
}


module.exports = ColorDefinition
