var crypto = require('crypto')

var base58 = require('bs58')

var verify = require('./verify')


/**
 * @class ColorSet
 *
 * A set of colors which belong to certain a asset.
 *
 * @param {ColorDefinitionManager} cdManager
 * @param {string[]} colorDescs
 */
function ColorSet(cdManager, colorDescs) {
  verify.ColorDefinitionManager(cdManager)
  verify.array(colorDescs)
  colorDescs.forEach(verify.string)

  this.colorDescs = colorDescs
  this.colorDefinitions = this.colorDescs.map(function(colorDesc) {
    return cdManager.resolveByDesc(colorDesc)
  })
  this.colorIds = this.colorDefinitions.map(function(colordef) { return colordef.getColorId() })
}

/**
 * @return {string}
 */
ColorSet.prototype.getColorHash = function() {
  // for compact replace ', ' to ',' as in ngcccbase
  var json = JSON.stringify(this.colorDescs.slice(0).sort()).replace(', ', ',')
  var hash = crypto.createHash('sha256').update(json).digest().slice(0, 10)
  return base58.encode(hash)
}

/**
 * @return {string[]}
 */
ColorSet.prototype.getColorDescs = function() {
  return this.colorDescs
}

/**
 * @return {ColorDefinition[]}
 */
ColorSet.prototype.getColorDefinitions = function() {
  return this.colorDefinitions
}

/**
 * @return {number[]}
 */
ColorSet.prototype.getColorIds = function() {
  return this.colorIds
}


module.exports = ColorSet
