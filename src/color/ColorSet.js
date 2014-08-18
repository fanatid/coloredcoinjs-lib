var assert = require('assert')
var crypto = require('crypto')

var base58 = require('bs58')
var _ = require('lodash')
var ColorDefinitionManager = require('./ColorDefinitionManager')


/**
 * @class ColorSet
 *
 * A set of colors which belong to certain a asset.
 *
 * @param {ColorDefinitionManager} cdManager
 * @param {Array} colorSchemes
 */
function ColorSet(cdManager, colorSchemes) {
  assert(cdManager instanceof ColorDefinitionManager,
    'Expected ColorDefinitionManager cdManager, got ' + cdManager)
  assert(_.isArray(colorSchemes), 'Expected Array colorSchemes, got ' + colorSchemes)
  colorSchemes.forEach(function(colorScheme) {
    assert(_.isString(colorScheme), 'Expected Array strings colorSchemes, got ' + colorSchemes)
  })

  this.colorSchemes = colorSchemes
  this.colorIds = this.colorSchemes.map(function(colorScheme) {
    return cdManager.resolveByScheme(colorScheme).getColorId()
  })
}

/**
 * @return {boolean}
 */
ColorSet.prototype.isUncoloredOnly = function() {
  return this.colorSchemes.every(function(scheme) { return scheme === '' })
}

/**
 * @return {boolean}
 */
ColorSet.prototype.isEPOBCOnly = function() {
  return this.colorSchemes.every(function(scheme) { return scheme.indexOf('epobc') === 0 })
}

/**
 * @return {string}
 */
ColorSet.prototype.getColorHash = function() {
  // for compact replace ', ' to ',' as in ngcccbase
  var json = JSON.stringify(this.colorSchemes.slice(0).sort()).replace(', ', ',')
  var hash = crypto.createHash('sha256').update(json).digest().slice(0, 10)
  return base58.encode(hash)
}

/**
 * @return {string[]}
 */
ColorSet.prototype.getColorSchemes = function() {
  return this.colorSchemes
}

/**
 * @return {number[]}
 */
ColorSet.prototype.getColorIds = function() {
  return this.colorIds
}


module.exports = ColorSet
