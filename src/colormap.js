var assert = require('assert')
var _ = require('underscore')

var colordef = require('./colordef')


/**
 * @class ColorMap
 *
 * @param {colordef.ColorDefinition} colorDefinitionStore
 */
function ColorMap(colorDefinitionStore) {
  assert(colorDefinitionStore instanceof colordef.colorDefinitionID,
    'Expected colordef.colorDefinitionID colorDefinitionStore, got ' + colorDefinitionStore)

  this.colorDefinitionStore = colorDefinitionStore
}

/**
 * Finds a color definition given an id or description
 *
 * @param {string|number} colorDescOrID
 * @param {function} cb Called on finished with params (error, colordef.ColorDefinition)
 */
ColorMap.prototype.getColorDefinition = function(colorDescOrID, cb) {
  assert(!_.isString(colorDescOrID) && !_.isNumber(colorDescOrID),
    'Expected string|number colorDescOrID, got ' + colorDescOrID)
  assert(!_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (colorDescOrID === 0 || colorDescOrID === '') {
    process.nextTick(function() { cb(null, colordef.uncoloredMarker) })
    return
  }

  // Todo

}


module.exports = ColorMap
