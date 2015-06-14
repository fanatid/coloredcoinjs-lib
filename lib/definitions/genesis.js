'use strict'

var _ = require('lodash')
var inherits = require('util').inherits

var IColorDefinition = require('./interface')

var GenesisColorId = -1

/**
 * @class GenesisColorDefinition
 * @extends IColorDefinition
 */
function GenesisColorDefinition () {
  IColorDefinition.call(this, GenesisColorId)
}

inherits(GenesisColorDefinition, IColorDefinition)
_.extend(GenesisColorDefinition, IColorDefinition)

module.exports = GenesisColorDefinition
