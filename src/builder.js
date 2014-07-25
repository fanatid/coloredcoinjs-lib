var assert = require('assert')
var inherits = require('util').inherits

var _ = require('underscore')

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

  tx.ins.forEach(function(currentTx) {
    var colorData = _this.colorDataStore.get({
      colorId: _this.colorDefinition.getColorId(),
      txId: Array.prototype.reverse.call(new Buffer(currentTx.hash)).toString('hex'),
      outIndex: currentTx.index
    })

    var colorValue = null
    if (colorData !== null) {
      empty = false
      colorValue = new colorvalue.SimpleColorValue({ colordef: _this.colorDefinition, value: colorData.value })
    }
    inColorValues.push(colorValue)
  })

  _this.colorDefinition.runKernel(tx, inColorValues, _this.blockchainState, function(error, outColorValues) {
    if (error) {
      cb(error)
      return
    }

    outColorValues.every(function(colorValue, index) {
      var skipAdd = colorValue === null || outputIndices.indexOf(index) === -1
      if (!skipAdd) {
        try {
          _this.colorDataStore.add({
            colorId: _this.colorDefinition.getColorId(),
            txId: tx.getId(),
            outIndex: index,
            value: colorValue.getValue()
          })

        } catch (e) {
          error = e
          return false
        }
      }

      return true
    })

    cb(error)
  })
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
