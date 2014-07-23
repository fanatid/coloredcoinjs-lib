var assert = require('assert')
var _ = require('underscore')
var inherits = require('util').inherits

var store = require('./store')
var blockchain = require('./blockchain')
var colordef = require('./colordef')
var colorvalue = require('./colorvalue')
var Transaction = require('./Transaction')


/**
 * @class BasicColorDataBuilder
 *
 * Base class for color data builder algorithms
 *
 * @param {store.ColorDataStore} colorDataStore
 * @param {blockchain.BlockchainStateBase} blockchainState
 * @param {colordef.ColorDefinition} colorDefinition
 */
function BasicColorDataBuilder(colorDefinition, colorDataStore, blockchainState) {
  assert(colorDefinition instanceof colordef.ColorDefinition,
    'Expected colordef.ColorDefinition colorDefinition, got ' + colorDefinition)
  assert(colorDataStore instanceof store.ColorDataStore,
    'Expected store.ColorDataStore colorDataStore, got ' + colorDataStore)
  assert(blockchainState instanceof blockchain.BlockchainStateBase,
    'Expected blockchain.BlockchainStateBase blockchainState, got ' + blockchainState)

  this.colorDataStore = colorDataStore
  this.blockchainState = blockchainState
  this.colorDefinition = colorDefinition
}

/**
 * Scan transaction to obtain color data for its outputs
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

    var colorId = _this.colorDefinition.getColorId()
    var txId = Array.prototype.reverse.call(new Buffer(tx.ins[index].hash)).toString('hex')

    _this.colorDataStore.get(colorId, txId, tx.ins[index].index, function(error, result) {
      if (error === null) {
        var colorValue = null

        if (result !== null) {
          empty = false
          colorValue = new colorvalue.SimpleColorValue({ colordef: _this.colorDefinition, value: result.value })
        }

        inColorValues.push(colorValue)

        getValue(index+1)

      } else {
        cb(error)
      }
    })
  }

  function runKernelCallback(error, outColorValues) {
    if (error === null)
      addValue(0, outColorValues)
    else
      cb(error)
  }

  function addValue(index, outColorValues) {
    if (index === outColorValues.length) {
      process.nextTick(function() { cb(null) })
      return
    }

    var skipAdd = outColorValues[index] === null || (outputIndices !== null && outputIndices.indexOf(index) === -1)
    if (skipAdd) {
      addValue(index+1, outColorValues)

    } else {
      var colorId = _this.colorDefinition.getColorId()
      var txId = tx.getId()
      var value = outColorValues[index].getValue()

      _this.colorDataStore.add(colorId, txId, index, value, function(error) {
        if (error === null)
          addValue(index+1, outColorValues)
        else
          cb(error)
      })
    }
  }

  process.nextTick(function() { getValue(0) })
}


/**
 * @class AidedColorDataBuilder
 *
 * Inherits BasicColorDataBuilder
 *
 * Color data builder based on following output spending transactions
 *  from the color's genesis transaction output, for one specific color
 *
 * @param {store.ColorDataStore} colorDataStore
 * @param {blockchain.BlockchainStateBase} blockchainState
 * @param {colordef.ColorDefinition} colorDefinition
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
