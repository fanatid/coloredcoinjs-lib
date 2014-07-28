var assert = require('assert')
var inherits = require('util').inherits

var _ = require('underscore')

var colordef = require('../colordef')
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
 * For a given txId, outIndex and colorDefinition return ColorValue or null if
 *  colorDefinition not represented in given txOut
 *
 * @param {string} txId
 * @param {number} outIndex
 * @param {colordef.ColorDefinition} colorDefinition
 * @param {function} cb Called on finished with params (error, ColorValue|null)
 */
ThinColorData.prototype.getColorValue = function(txId, outIndex, colorDefinition, cb) {
  assert(Transaction.isTxId(txId), 'Expected transactionId txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(colorDefinition instanceof colordef.ColorDefinition,
    'Expected ColorDefinition colorDefinition, got ' + colorDefinition)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this
  var scannedOutputs = []

  function processOne(txId, outIndex, cb) {
    if (scannedOutputs.indexOf(txId + outIndex) !== -1) {
      process.nextTick(function() { cb(null) })
      return
    }
    scannedOutputs.push(txId + outIndex)

    var colorValue = _this.fetchColorValue(txId, outIndex, colorDefinition)
    if (colorValue !== null) {
      process.nextTick(function() { cb(null) })
      return
    }

    _this.blockchainState.getTx(txId, function(error, tx) {
      if (error !== null) {
        cb(error)
        return
      }

      colorDefinition.getAffectingInputs(tx, [outIndex], _this.blockchainState, function(error, inputs) {
        if (error === null)
          runProcesses(tx, inputs, 0)
        else
          cb(error)
      })
    })

    function runProcesses(tx, inputs, index) {
      if (index === inputs.length) {
        _this.scanTx(tx, [outIndex], colorDefinition, cb)
        return
      }
 
      var txId = Array.prototype.reverse.call(new Buffer(inputs[index].hash)).toString('hex')
 
      processOne(txId, inputs[index].index, function(error) {
        if (error === null)
          runProcesses(tx, inputs, index + 1)
        else
          cb(error)
      })
    }
  }

  processOne(txId, outIndex, function(error) {
    if (error === null)
      cb(null, _this.fetchColorValue(txId, outIndex, colorDefinition))
    else
      cb(error)
  })
}


module.exports = ThinColorData
