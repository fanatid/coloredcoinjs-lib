var assert = require('assert')
var _ = require('underscore')
var inherits = require('inherits')

var blockchain = require('./blockchain')
var builder = require('./builder')
var colordef = require('./colordef')
var colorvalue = require('./colorvalue')
var store = require('./store')
var Transaction = require('./transaction')


/**
 * Check that cls inherits one of the parents classes
 *
 * @param {function} cls Constructor
 * @param {Array} parents Array of constructors
 */
function isDerived(cls, parents) {
  return (parents.indexOf(cls) !== -1 || (!_.isUndefined(cls.super_) && isDerived(cls.super_, parents)))
}

/**
 * @class StoredColorData
 *
 * Base color data class
 *
 * @param {store.ColorDataStore} colorDataStore
 * @param {blockchain.BlockchainStateBase} blockchainState
 * @param {builder.AidedColorDataBuilder} builderClass
 *  Now can be only AidedColorDataBuilder or derived classes
 */
function StoredColorData(colorDataStore, blockchainState, builderClass) {
  assert(colorDataStore instanceof store.ColorDataStore,
    'Expected store.ColorDataStore colorDataStore, got ' + colorDataStore)
  assert(blockchainState instanceof blockchain.BlockchainStateBase,
    'Expected blockchain.BlockchainStateBase blockchainState, got ' + blockchainState)
  assert(isDerived(builderClass, [builder.AidedColorDataBuilder]),
    'Expected builderClass builder.AidedColorDataBuilder, got ' + builderClass)

  this.colorDataStore = colorDataStore
  this.blockchainState = blockchainState
  this.builderClass = builderClass
}

/**
 * Returns colorValues currently present in colorDataStore
 *
 * @param {Array} colorDefinitionSet
 * @param {string} txId
 * @param {number} outIndex
 * @param {colorvalue.ColorValue} colorValueClass
 * @param {function} cb Called on finished with params (error, Array)
 */
StoredColorData.prototype.fetchColorvalues = function(colorDefinitionSet, txId, outIndex, colorValueClass, cb) {
  assert(_.isArray(colorDefinitionSet), 'Expected Array colorDefinitionSet, got ' + colorDefinitionSet)
  assert(colorDefinitionSet.every(function(cd) { return (cd instanceof colordef.ColorDefinition) }),
    'Expected colorDefinitionSet Array colordef.ColorDefinition, got ' + colorDefinitionSet)
  assert(Transaction.isTxId(txId), 'Expected transactionId txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(isDerived(colorValueClass, [colorvalue.ColorValue]),
    'Expected colorValueClass colorvalue.ColorValue, got ' + colorValueClass)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.colorDataStore.getAny(txId, outIndex, function(error, records) {
    if (error !== null) {
      cb(error)
      return
    }

    var result = []
    var colorDefinitionMap = {}

    colorDefinitionSet.forEach(function(colorDefinition) {
      colorDefinitionMap[colorDefinition.getColorId()] = colorDefinition
    })

    records.forEach(function(record) {
      if (_.isUndefined(colorDefinitionMap[record.colorId]))
        return

      result.push(new colorValueClass({ colordef: colorDefinitionMap[record.colorId], value: record.value }))
    })

    process.nextTick(function() { cb(null, result) })
  })
}


/**
 * @class ThinColorData
 *
 * Inherits StoredColorData
 *
 * Color data which needs access to the blockchain state up to the genesis of color
 *
 * @param {store.ColorDataStore} colorDataStore
 * @param {blockchain.BlockchainStateBase} blockchainState
 * @param {builder.BasicColorDataBuilder} builderClass
 */
function ThinColorData() {
  StoredColorData.apply(this, Array.prototype.slice.call(arguments))
}

inherits(ThinColorData, StoredColorData)

/**
 * For a given transaction txId and output outIndex and color
 *  colorDefinitionSet, return a Array of objects that looks like 
 *  { colorId: colordef.ColorDefinition, value: number }
 *
 * @param {Array} colorDefinitionSet
 * @param {string} txId
 * @param {number} outIndex
 * @param {colorvalue.ColorValue} colorValueClass
 * @param {function} cb Called on finished with params (error, Array)
 */
ThinColorData.prototype.getColorValues = function(colorDefinitionSet, txId, outIndex, cb) {
  assert(_.isArray(colorDefinitionSet), 'Expected Array colorDefinitionSet, got ' + colorDefinitionSet)
  assert(colorDefinitionSet.every(function(cd) { return (cd instanceof colordef.ColorDefinition) }),
    'Expected colorDefinitionSet Array colordef.ColorDefinition, got ' + colorDefinitionSet)
  assert(Transaction.isTxId(txId), 'Expected transaction id txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this
  var scannedOutputs = []

  /**
   * For any tx out, process the colorValues of the affecting inputs first
   *  and then scan that tx.
   */
  function processOne(txId, outIndex, cb) {
    if (scannedOutputs.indexOf(txId + outIndex) !== -1) {
      process.nextTick(function() { cb(null) })
      return
    }

    scannedOutputs.push(txId + outIndex)

    function fetchColorvaluesCallback(error, result) {
      if (error === null && result.length === 0)
        _this.blockchainState.getTx(txId, getTxCallback)
      else
        cb(error)
    }

    function getTxCallback(error, tx) {
      if (error === null)
        getAffectingInputsProcess(0, tx, {})
      else
        cb(error)
    }

    function getAffectingInputsProcess(index, tx, inputs) {
      if (index === colorDefinitionSet.length) {
        var inputsArray = Object.keys(inputs).map(function(k){ return inputs[k] })
        process.nextTick(function() { runProcesses(0, inputsArray, tx) })
        return
      }

      var colorDefinition = colorDefinitionSet[index]
      colorDefinition.getAffectingInputs(tx, [outIndex], _this.blockchainState, function(error, affectingInputs) {
        if (error !== null) {
          cb(error)
          return
        }

        affectingInputs.forEach(function(affectingInput) {
          inputs[affectingInput.hash] = affectingInput
        })

        getAffectingInputsProcess(index + 1, tx, inputs)
      })
    }

    function runProcesses(index, inputs, tx) {
      if (index === inputs.length) {
        process.nextTick(function() { scanTx(0, tx) })
        return
      }

      var txId = Array.prototype.reverse.call(new Buffer(inputs[index].hash)).toString('hex')

      processOne(txId, inputs[index].index, function(error) {
        if (error === null)
          runProcesses(index + 1, inputs, tx)
        else
          cb(error)
      })
    }

    function scanTx(index, tx) {
      if (index === colorDefinitionSet.length) {
        process.nextTick(function() { cb(null) })
        return
      }

      var builder = new _this.builderClass(colorDefinitionSet[index], _this.colorDataStore, _this.blockchainState)

      builder.scanTx(tx, [outIndex], function(error) {
        if (error === null)
          scanTx(index + 1, tx)
        else
          cb(error)
      })
    }

    _this.fetchColorvalues(colorDefinitionSet, txId, outIndex, colorvalue.SimpleColorValue, fetchColorvaluesCallback)
  }

  process.nextTick(function() {
    processOne(txId, outIndex, function(error) {
      if (error === null)
        _this.fetchColorvalues(colorDefinitionSet, txId, outIndex, colorvalue.SimpleColorValue, cb)
      else
        cb(error)
    })
  })
}


module.exports = {
  /* test-code */
  StoredColorData: StoredColorData,
  /* end-test-code */

  ThinColorData: ThinColorData
}
