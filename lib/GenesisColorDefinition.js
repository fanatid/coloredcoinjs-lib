var inherits = require('util').inherits

var ColorDefinition = require('./ColorDefinition')
var errors = require('./errors')


var GenesisColorId = -1


/**
 * @class GenesisColorDefinition
 * @extends ColorDefinition
 */
function GenesisColorDefinition() {
  ColorDefinition.call(this, GenesisColorId)
}

inherits(GenesisColorDefinition, ColorDefinition)

/**
 * @throws {NotImplementedError}
 */
GenesisColorDefinition.prototype.getColorType = function () {
  throw new errors.NotImplementedError('GenesisColorDefinition.getColorType')
}

/**
 * @throws {NotImplementedError}
 */
GenesisColorDefinition.prototype.getDesc = function () {
  throw new errors.NotImplementedError('GenesisColorDefinition.getDesc')
}


module.exports = GenesisColorDefinition
