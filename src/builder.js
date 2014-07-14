var assert = require('assert')
var _ = require('underscore')
var inherits = require('inherits')

var store = require('./store')
var blockchain = require('./blockchain')
var colordef = require('./colordef')
var colorvalue = require('./colorvalue')
var Transaction = require('./transaction')


/**
 * @class BasicColorDataBuilder
 *
 * @param {store.ColorDataStore} colorDataStore
 * @param {blockchain.BlockchainStateBase} blockchainState
 * @param {colordef.ColorDefinition} colorDefinition
 */
function BasicColorDataBuilder(colorDataStore, blockchainState, colorDefinition) {
  assert(colorDataStore instanceof store.ColorDataStore,
    'Expected store.ColorDataStore colorDataStore, got ' + colorDataStore)
  assert(blockchainState instanceof blockchain.BlockchainStateBase,
    'Expected blockchain.BlockchainStateBase blockchainState, got ' + blockchainState)
  assert(colorDefinition instanceof colordef.ColorDefinition,
    'Expected colordef.ColorDefinition colorDefinition, got ' + colorDefinition)

  this.colorDataStore = colorDataStore
  this.blockchainState = blockchainState
  this.colorDefinition = colorDefinition
  this.colorDefinitionID = colorDefinition.getColorID()
}

/**
 * @param {Transaction} tx
 * @param {Array|null} outputIndices
 * @param {function} cb Called on finished with params (error)
 */
BasicColorDataBuilder.prototype.scanTx = function(tx, outputIndices, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  if (outputIndices !== null) {
    assert(_.isArray(outputIndices), 'Expected Array outputIndices, got ' + outputIndices)
    assert(outputIndices.every(function(oi) { return _.isNumber(oi) }),
      'Expected outputIndices Array numbers, got ' + outputIndices)
  }
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  var inColorValues = []
  var empty = true

  function getValue(index) {
    if (tx.ins.length === index) {
      if (empty && !_this.colorDefinition.isSpecialTx(tx))
        process.nextTick(function() { cb(null) })
      else
        _this.colorDefinition.runKernel(tx, inColorValues, _this.blockchainState, runKernelCallback)

      return
    }

    var txHash = Array.prototype.reverse.call(tx.ins[index].hash).toString('hex')

    _this.colorDataStore.get(_this.colorDefinitionID, txHash, tx.ins[index].index, function(error, result) {
      if (error === null) {
        if (result === null) {
          inColorValues.push(null)

        } else {
          empty = false
          inColorValues.push(
            new colorvalue.SimpleColorValue({ colordef: _this.colorDefinition, value: result.value }))
        }

        process.nextTick(function() { getValue(index+1) })

      } else {
        process.nextTick(function() { cb(error) })
      }
    })
  }

  function runKernelCallback(error, outColorValues) {
    if (error === null)
      process.nextTick(function() { addValue(outColorValues, 0) })
    else
      process.nextTick(function() { cb(error) })
  }

  function addValue(outColorValues, index) {
    if (index === outColorValues.length) {
      process.nextTick(function() { cb(null) })
      return
    }

    var skipAdd = outColorValues[index] === null || (outputIndices !== null && outputIndices.indexOf(index) === -1)
    if (skipAdd) {
      process.nextTick(function() { addValue(outColorValues, index+1) })

    } else {
      var txHash = tx.getId()
      var value = outColorValues[index].getValue()

      _this.colorDataStore.add(_this.colorDefinitionID, txHash, index, value, function(error) {
        if (error === null)
          process.nextTick(function() { addValue(outColorValues, index+1) })
        else
          process.nextTick(function() { cb(error) })
      })
    }
  }

  process.nextTick(function() { getValue(0) })
}


/**
 * @class AidedColorDataBuilder
 *
 * Inherits BasicColorDataBuilder
 */
function AidedColorDataBuilder() {
  BasicColorDataBuilder.apply(this, Array.prototype.slice.call(arguments))
}

inherits(AidedColorDataBuilder, BasicColorDataBuilder)


module.exports = {
  /* test-code */
  BasicColorDataBuilder: BasicColorDataBuilder,
  /* end-test-code */

  AidedColorDataBuilder: AidedColorDataBuilder
}
