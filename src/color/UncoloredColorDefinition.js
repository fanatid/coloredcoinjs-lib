var inherits = require('util').inherits

var ColorDefinition = require('./ColorDefinition')


/**
 * @class UncoloredColorDefinition
 *
 * Inherits ColorDefinition
 */
function UncoloredColorDefinition() {
  ColorDefinition.call(this, { colorId: 0 })
}

inherits(UncoloredColorDefinition, ColorDefinition)


module.exports = UncoloredColorDefinition
