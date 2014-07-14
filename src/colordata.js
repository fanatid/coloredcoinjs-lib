var assert = require('assert')
var _ = require('underscore')
var inherits = require('inherits')

var blockchain = require('./blockchain')
var colordef = require('./colordef')
var colorvalue = require('./colorvalue')
var store = require('./store')


/**
 * @class StoredColorData
 *
 * Base color data class
 *
 * @param {store.ColorDataStore} colorDataStore
 * @param {blockchain.BlockchainStateBase} blockchainState
 * @param {builder.BasicColorDataBuilder} builderClass
 */
function StoredColorData(colorDataStore, blockchainState, builderClass) {
  assert(colorDataStore instanceof store.ColorDataStore,
    'Expected store.ColorDataStore colorDataStore, got ' + colorDataStore)
  assert(blockchainState instanceof blockchain.BlockchainStateBase,
    'Expected blockchain.BlockchainStateBase blockchainState, got ' + blockchainState)
  // Todo: check builderClass

  this.colorDataStore = colorDataStore
  this.blockchainState = blockchainState
  this.builderClass = builderClass
}

/**
 * Generate colorDefinitionMap from colorDefinitionSet
 *
 * @param {Array} colorDefinitionSet
 * @return {object}
 */
StoredColorData.prototype.convertColorDefinitionSetToMap = function(colorDefinitionSet) {
  assert(_.isArray(colorDefinitionSet), 'Expected Array colorDefinitionSet, got ' + colorDefinitionSet)
  assert(colorDefinitionSet.every(function(cd) { return (cd instanceof colordef.ColorDefinition) }),
    'Expected colorDefinitionSet Array colordef.ColorDefinition, got ' + colorDefinitionSet)

  var colorDefinitionMap = {}

  colorDefinitionSet.forEach(function(colorDefinition) {
    colorDefinitionMap[colorDefinition.getColorID()] = colorDefinition
  })

  return colorDefinitionMap
}

/**
 * Returns colorValues currently present in colorDataStore
 *
 * @param {Array} colorDefinitionSet
 * @param {string} txHash
 * @param {number} outIndex
 * @param {colorvalue.ColorValue} colorValueClass
 * @param {function} cb Called on finished with params (error, Array)
 */
StoredColorData.prototype.fetchColorvalues = function(colorDefinitionSet, txHash, outIndex, colorValueClass, cb) {
  assert(_.isArray(colorDefinitionSet), 'Expected Array colorDefinitionSet, got ' + colorDefinitionSet)
  assert(colorDefinitionSet.every(function(cd) { return (cd instanceof colordef.ColorDefinition) }),
    'Expected colorDefinitionSet Array colordef.ColorDefinition, got ' + colorDefinitionSet)
  assert(_.isString(txHash), 'Expected string txHash, got ' + txHash)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
// how check colorValueClass? colorValueClass.super_ ?
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  this.colorDataStore.getAny(txHash, outIndex, function(error, records) {
    if (error !== null) {
      cb(error, null)
      return
    }

    var result = []
    var colorDefinitionMap = _this.convertColorDefinitionSetToMap(colorDefinitionSet)

    records.forEach(function(record) {
      if (colorDefinitionMap[record.colorID] === undefined)
        return

      result.push(new colorValueClass({ colordef: colorDefinitionMap[record.colorID], value: record.value }))
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
 * For a given transaction <txHash> and output <outIndex> and color
 * <colorDefinitionSet>, return a Array of objects that looks like 
 * { colorID: colordef.ColorDefinition, value: number }
 *
 * @param {Array} colorDefinitionSet
 * @param {string} txHash
 * @param {number} outIndex
 * @param {colorvalue.ColorValue} colorValueClass
 * @param {function} cb Called on finished with params (error, Array)
 */
ThinColorData.prototype.getColorValues = function(colorDefinitionSet, txHash, outIndex, cb) {
  assert(_.isArray(colorDefinitionSet), 'Expected Array colorDefinitionSet, got ' + colorDefinitionSet)
  assert(colorDefinitionSet.every(function(cd) { return (cd instanceof colordef.ColorDefinition) }),
    'Expected colorDefinitionSet Array colordef.ColorDefinition, got ' + colorDefinitionSet)
  assert(_.isString(txHash), 'Expected string txHash, got ' + txHash)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this
  var scannedOutputs = []

  /**
   * For any tx out, process the colorValues of the affecting inputs first
   *  and then scan that tx.
   */
  function processOne(txHash, outIndex, cb) {
    if (scannedOutputs.indexOf(txHash + outIndex) !== -1) {
      process.nextTick(function() { cb(null) })
      return
    }

    scannedOutputs.push(txHash + outIndex)

    function fetchColorvaluesCallback(error, result) {
      if (error === null || result.length === 0)
        _this.blockchainState.getTx(txHash, getTxCallback)
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
        runProcesses(tx, Object.keys(inputs).map(function(k){ return inputs[k] }))
        return
      }

      colorDefinitionSet[index].getAffectingInputs(tx, [outIndex], _this.blockchainState, function(error, affectingInputs) {
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

    function runProcesses(index, tx, inputs) {
      if (index === inputs.length) {
        scanTx(0, tx)
        return
      }

      var txHash = Array.prototype.reverse.call(inputs[index].hash).toString('hex')

      processOne(txHash, inputs[index].index, function(error) {
        if (error === null)
          runProcesses(index + 1, tx, inputs)
        else
          cb(error)
      })
    }

    function scanTx(index, tx) {
      if (index === colorDefinitionSet.length) {
        cb(null)
        return
      }

      var builder = new _this.builderClass(_this.colorDataStore, _this.blockchainState, colorDefinitionSet[index])

      builder.scanTx(tx, [outIndex], function(error) {
        if (error === null)
          scanTx(index + 1, tx)
        else
          cb(error)
      })
    }

    _this.fetchColorvalues(colorDefinitionSet, txHash, outIndex, colorvalue.SimpleColorValue, fetchColorvaluesCallback)
  }

  process.nextTick(function() {
    processOne(txHash, outIndex, function(error) {
      if (error === null)
        _this.fetchColorvalues(colorDefinitionSet, txHash, outIndex, colorvalue.SimpleColorValue, cb)
      else
        cb(error)
    })
  })
}


module.exports = {
  StoredColorData: StoredColorData,
  ThinColorData: ThinColorData
}
