var assert = require('assert')
var _ = require('underscore')
var inherits = require('inherits')

var store = require('./store')
var blockchain = require('./blockchain')
var colordef = require('./colordef')
var Transaction = require('./transaction')


/**
 * @class ColorDataBuilder
 */
function ColorDataBuilder() {}


/**
 * @class BasicColorDataBuilder
 *
 * Inherits ColorDataBuilder
 *
 * @param {store.ColorDataStore} colorDataStore
 * @param {blockchain.BlockchainStateBase} blockchainState
 * @param {colordef.ColorDefinition} colorDefinition
 */
function BasicColorDataBuilder(colorDataStore, blockchainState, colorDefinition) {
  ColorDataBuilder.call(this)

  assert(colorDataStore instanceof store.ColorDataStore,
    'Expected store.ColorDataStore colorDataStore, got ' + colorDataStore)
  assert(blockchainState instanceof blockchain.BlockchainStateBase,
    'Expected store.ColorDataStore blockchainState, got ' + blockchainState)
  assert(colorDefinition instanceof colordef.ColorDefinition,
    'Expected store.ColorDataStore colorDefinition, got ' + colorDefinition)

  this.colorDataStore = colorDataStore
  this.blockchainState = blockchainState
  this.colorDefinition = colorDefinition
  this.colorDefinitionID = colorDefinition.getColorID()
}

inherits(BasicColorDataBuilder, ColorDataBuilder)

/**
 *
 * @param {Transaction} tx
 * @param {Array} outputIndices
 * @param {function} cb Called on finished with params (error)
 */
BasicColorDataBuilder.prototype.scanTx = function(tx, outputIndices, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isArray(outputIndices), 'Expected Array outputIndices, got ' + outputIndices)
  assert(outputIndices.every(function(oi) { return _.isNumber(oi) }),
    'Expected outputIndices Array numbers, got ' + outputIndices)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.blockchainState.ensureInputValues(tx, function(error, tx) {
    cb(null)
  })
}


module.exports = {
  /* test-code */
  ColorDataBuilder: ColorDataBuilder,
  /* end-test-code */

  BasicColorDataBuilder: BasicColorDataBuilder
}
