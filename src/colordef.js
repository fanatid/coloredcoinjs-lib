var inherits = require('inherits')

/**
 * Represents a color definition scheme. This means how color exists and
 *  is transferred in the blockchain
 *
 * @class ColorDefinition
 */
function ColorDefinition(colorID) {
  this.colorID = colorID
}


var GENESIS_OUTPUT_MARKER = ColorDefinition(-1)
var UNCOLORED_MARKER = ColorDefinition(0)


/**
 * @class GenesisColorDefinition
 */
function GenesisColorDefinition(colorID, genesis) {
  ColorDefinition.apply(this, colorID)
  this.genesis = genesis
}

inherits(GenesisColorDefinition, ColorDefinition)


/**
 * @class EPOBCColorDefinition
 */
function EPOBCColorDefinition() {
  GenesisColorDefinition.apply(this, Array.prototype.slice.call(arguments, 0))
}

inherits(EPOBCColorDefinition, GenesisColorDefinition)


module.exports = {
  ColorDefinition: ColorDefinition,
  EPOBCColorDefinition: EPOBCColorDefinition,

  GENESIS_OUTPUT_MARKER: GENESIS_OUTPUT_MARKER,
  UNCOLORED_MARKER: UNCOLORED_MARKER
}
