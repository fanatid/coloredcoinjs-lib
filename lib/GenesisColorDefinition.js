var inherits = require('util').inherits

var ColorDefinition = require('./ColorDefinition')
var errors = require('./errors')

var GenesisColorId = -1

/**
 * @class GenesisColorDefinition
 * @extends ColorDefinition
 */
function GenesisColorDefinition () {
  ColorDefinition.call(this, GenesisColorId)
}

inherits(GenesisColorDefinition, ColorDefinition)

/**
 * @throws {NotImplementedError}
 */
GenesisColorDefinition.prototype.getColorCode = function () {
  throw new errors.NotImplementedError('GenesisColorDefinition.getColorCode')
}

/**
 * @throws {NotImplementedError}
 */
GenesisColorDefinition.prototype.getDesc = function () {
  throw new errors.NotImplementedError('GenesisColorDefinition.getDesc')
}

module.exports = GenesisColorDefinition
