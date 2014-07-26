var assert = require('assert')
var inherits = require('util').inherits

var _ = require('underscore')

var colordef = require('../colordef')
var ColorValue = require('../ColorValue')
var StoredColorData = require('./StoredColorData')
var Transaction = require('../Transaction')


/**
 * @class ThinColorData
 *
 * Inherits StoredColorData
 *
 * Color data which needs access to the blockchain state up to the genesis of color
 *
 * @param {store.ColorDataStore} colorDataStore
 * @param {blockchain.BlockchainStateBase} blockchainState
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
  var colorValues

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

      _this.scanTx(tx, [outIndex], colorDefinitionSet[index], function(error) {
        if (error === null)
          scanTx(index + 1, tx)
        else
          cb(error)
      })
    }

    colorValues = _this.fetchColorvalues(colorDefinitionSet, txId, outIndex)
    if (colorValues.length === 0)
      _this.blockchainState.getTx(txId, getTxCallback)
    else
      process.nextTick(function() { cb(null) })
  }

  process.nextTick(function() {
    processOne(txId, outIndex, function(error) {
      colorValues = undefined

      if (error === null)
        colorValues = _this.fetchColorvalues(colorDefinitionSet, txId, outIndex)

      cb(error, colorValues)
    })
  })
}


module.exports = ThinColorData
