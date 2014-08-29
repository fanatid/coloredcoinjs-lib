var inherits = require('util').inherits

var ColorDefinition = require('./ColorDefinition')


var GenesisColorId = -1


/**
 * @class GenesisColorDefinition
 *
 * Inherits ColorDefinition
 */
function GenesisColorDefinition() {
  ColorDefinition.call(this, GenesisColorId)
}

inherits(GenesisColorDefinition, ColorDefinition)


module.exports = GenesisColorDefinition
