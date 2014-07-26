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
 * Returns colorValues currently present in colorDataStore
 *
 * @param {Array} colorDefinitionSet
 * @param {string} txId
 * @param {number} outIndex
 * @return {Array}
 */
StoredColorData.prototype.fetchColorvalues = function(colorDefinitionSet, txId, outIndex) {
  assert(_.isArray(colorDefinitionSet), 'Expected Array colorDefinitionSet, got ' + colorDefinitionSet)
  assert(colorDefinitionSet.every(function(cd) { return (cd instanceof colordef.ColorDefinition) }),
    'Expected colorDefinitionSet Array colordef.ColorDefinition, got ' + colorDefinitionSet)
  assert(Transaction.isTxId(txId), 'Expected transactionId txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)

  var result = []
  var colorDefinitionMap = {}

  colorDefinitionSet.forEach(function(colorDefinition) {
    colorDefinitionMap[colorDefinition.getColorId()] = colorDefinition
  })

  this.colorDataStore.getAny({txId: txId, outIndex: outIndex}).forEach(function(record) {
    if (_.isUndefined(colorDefinitionMap[record.colorId]))
      return

    result.push(new ColorValue({ colordef: colorDefinitionMap[record.colorId], value: record.value }))
  })

  return result
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

  tx.ins.forEach(function(currentTx) {
    var colorData = _this.colorDataStore.get({
      colorId: colorDefinition.getColorId(),
      txId: Array.prototype.reverse.call(new Buffer(currentTx.hash)).toString('hex'),
      outIndex: currentTx.index
    })

    var colorValue = null
    if (colorData !== null) {
      empty = false
      colorValue = new ColorValue({ colordef: colorDefinition, value: colorData.value })
    }
    inColorValues.push(colorValue)
  })

  colorDefinition.runKernel(tx, inColorValues, _this.blockchainState, function(error, outColorValues) {
    if (error) {
      cb(error)
      return
    }

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

    cb(error)
  })
}


module.exports = StoredColorData
