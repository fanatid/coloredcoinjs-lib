var inherits = require('util').inherits

var IColorDefinition = require('./interface')
var errors = require('../errors')

var GenesisColorId = -1

/**
 * @class GenesisColorDefinition
 * @extends IColorDefinition
 */
function GenesisColorDefinition () {
  IColorDefinition.call(this, GenesisColorId)
}

inherits(GenesisColorDefinition, IColorDefinition)

GenesisColorDefinition.getColorCode = function () {
  throw new errors.NotImplementedError('GenesisColorDefinition.code')
}

GenesisColorDefinition.prototype.getDesc = function () {
  throw new errors.NotImplementedError('GenesisColorDefinition.desc')
}

/**
 * @param {number} colorId
 * @param {string} desc
 * @return {IColorDefinition}
 */
GenesisColorDefinition.fromDesc = function () {
  throw new errors.NotImplementedError(
    'GenesisColorDefinition.fromDesc')
}

/**
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
GenesisColorDefinition.makeComposedTx = function () {
  throw new errors.NotImplementedError(
    'GenesisColorDefinition.makeComposedTx')
}

/**
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
GenesisColorDefinition.composeGenesisTx = function () {
  throw new errors.NotImplementedError(
    'GenesisColorDefinition.composeGenesisTx')
}

module.exports = GenesisColorDefinition
