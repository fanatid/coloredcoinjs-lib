var assert = require('assert')

var _ = require('underscore')

var blockchain = require('../blockchain')
var colordef = require('../colordef')
var ColorValue = require('../ColorValue')
var store = require('../store')
var Transaction = require('../Transaction')


/**
 * @class StoredColorData
 *
 * Base color data class
 *
 * @param {store.ColorDataStore} colorDataStore
 * @param {blockchain.BlockchainStateBase} blockchainState
 *  Now can be only AidedColorDataBuilder or derived classes
 */
function StoredColorData(colorDataStore, blockchainState) {
  assert(colorDataStore instanceof store.ColorDataStore,
    'Expected store.ColorDataStore colorDataStore, got ' + colorDataStore)
  assert(blockchainState instanceof blockchain.BlockchainStateBase,
    'Expected blockchain.BlockchainStateBase blockchainState, got ' + blockchainState)

  this.colorDataStore = colorDataStore
  this.blockchainState = blockchainState
}

/**
 * Return ColorValue currently present in colorDataStore
 *
 * @param {string} txId
 * @param {number} outIndex
 * @param {colordef.ColorDefinition} colorDefinition
 * @return {ColorValue|null}
 */
StoredColorData.prototype.fetchColorValue = function(txId, outIndex, colorDefinition) {
  assert(Transaction.isTxId(txId), 'Expected transactionId txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(colorDefinition instanceof colordef.ColorDefinition,
    'Expected ColorDefinition colorDefinition, got ' + colorDefinition)

  var colorValue = null

  var colorData = this.colorDataStore.get({
    colorId: colorDefinition.getColorId(),
    txId: txId,
    outIndex: outIndex
  })
  if (colorData !== null)
    colorValue = new ColorValue({ colordef: colorDefinition, value: colorData.value })

  return colorValue
}

/**
 * Scan transaction to obtain color data for its outputs
 *
 * @param {Transaction} tx
 * @param {Array} outputIndices
 * @param {colordef.ColorDefinition} colorDefinition
 * @param {function} cb Called on finished with params (error)
 */
StoredColorData.prototype.scanTx = function(tx, outputIndices, colorDefinition, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isArray(outputIndices), 'Expected Array outputIndices, got ' + outputIndices)
  assert(outputIndices.every(function(oi) { return _.isNumber(oi) }),
    'Expected outputIndices Array numbers, got ' + outputIndices)
  assert(colorDefinition instanceof colordef.ColorDefinition,
    'Expected colordef.ColorDefinition colorDefinition, got ' + colorDefinition)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  var inColorValues = []
  var empty = true

  tx.ins.forEach(function(input) {
    var colorData = _this.colorDataStore.get({
      colorId: colorDefinition.getColorId(),
      txId: Array.prototype.reverse.call(new Buffer(input.hash)).toString('hex'),
      outIndex: input.index
    })

    var colorValue = null
    if (colorData !== null) {
      empty = false
      colorValue = new ColorValue({ colordef: colorDefinition, value: colorData.value })
    }
    inColorValues.push(colorValue)
  })

  if (empty && !colorDefinition.isSpecialTx(tx)) {
    cb(null)
    return
  }

  colorDefinition.runKernel(tx, inColorValues, _this.blockchainState, function(error, outColorValues) {
    if (error === null) {
      outColorValues.every(function(colorValue, index) {
        var skipAdd = colorValue === null || outputIndices.indexOf(index) === -1

        if (!skipAdd) {
          try {
            _this.colorDataStore.add({
              colorId: colorDefinition.getColorId(),
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
    }

    cb(error)
  })
}


module.exports = StoredColorData
