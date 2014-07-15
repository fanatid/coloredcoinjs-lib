var assert = require('assert')
var _ = require('underscore')

var colordef = require('./colordef')


/**
 * @class ColorMap
 *
 * @param {colordef.ColorDefinition} colorDefinitionStore
 */
function ColorMap(colorDefinitionStore) {
  assert(colorDefinitionStore instanceof colordef.colorDefinitionId,
    'Expected colordef.colorDefinitionId colorDefinitionStore, got ' + colorDefinitionStore)

  this.colorDefinitionStore = colorDefinitionStore
}

/**
 * Finds a color definition given an id or description
 *
 * @param {string|number} colorDescOrId
 * @param {function} cb Called on finished with params (error, colordef.ColorDefinition)
 */
ColorMap.prototype.getColorDefinition = function(colorDescOrId, cb) {
  assert(!_.isString(colorDescOrId) && !_.isNumber(colorDescOrId),
    'Expected string|number colorDescOrId, got ' + colorDescOrId)
  assert(!_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (colorDescOrId === 0 || colorDescOrId === '') {
    process.nextTick(function() { cb(null, colordef.uncoloredMarker) })
    return
  }

  // Todo

}


module.exports = ColorMap
