var assert = require('assert')

var _ = require('underscore')

var blockchain = require('./blockchain')
var colordef = require('./colordef')
var ColorValue = require('./ColorValue')
var store = require('./store')
var Transaction = require('./Transaction')


/**
 * @class ColorData
 *
 * Color data which needs access to the blockchain state up to the genesis of color
 *
 * @param {Object} data
 * @param {store.ColorDataStore} data.cdStore
 * @param {blockchain.BlockchainStateBase} data.blockchain
 */
function ColorData(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(data.cdStore instanceof store.ColorDataStore,
    'Expected store.ColorDataStore data.cdStore, got ' + data.cdStore)
  assert(data.blockchain instanceof blockchain.BlockchainStateBase,
    'Expected blockchain.BlockchainStateBase data.blockchain, got ' + data.blockchain)

  this.cdStore = data.cdStore
  this.blockchain = data.blockchain
}

/**
 * Return ColorValue currently present in ColorDataStore
 *
 * @param {string} txId
 * @param {number} outIndex
 * @param {colordef.ColorDefinition} colorDefinition
 * @return {ColorValue|null}
 */
ColorData.prototype.fetchColorValue = function(txId, outIndex, colorDefinition) {
  assert(Transaction.isTxId(txId), 'Expected transactionId txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(colorDefinition instanceof colordef.ColorDefinition,
    'Expected ColorDefinition colorDefinition, got ' + colorDefinition)

  var colorValue = null

  var colorData = this.cdStore.get({
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
 * @param {Array|null} outputIndices
 * @param {colordef.ColorDefinition} colorDefinition
 * @param {function} cb Called on finished with params (error)
 */
ColorData.prototype.scanTx = function(tx, outputIndices, colorDefinition, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isArray(outputIndices) || _.isNull(outputIndices), 'Expected Array|null outputIndices, got ' + outputIndices)
  if (_.isArray(outputIndices))
    assert(outputIndices.every(function(oi) { return _.isNumber(oi) }),
      'Expected outputIndices Array numbers, got ' + outputIndices)
  assert(colorDefinition instanceof colordef.ColorDefinition,
    'Expected colordef.ColorDefinition colorDefinition, got ' + colorDefinition)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  var inColorValues = []
  var empty = true

  tx.ins.forEach(function(input) {
    var colorData = _this.cdStore.get({
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

  colorDefinition.runKernel(tx, inColorValues, _this.blockchain, function(error, outColorValues) {
    if (error === null) {
      outColorValues.every(function(colorValue, index) {
        var skipAdd = colorValue === null || (outputIndices !== null && outputIndices.indexOf(index) === -1)

        if (!skipAdd) {
          try {
            _this.cdStore.add({
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

/**
 * For a given txId, outIndex and colorDefinition return ColorValue or null if
 *  colorDefinition not represented in given txOut
 *
 * @param {string} txId
 * @param {number} outIndex
 * @param {colordef.ColorDefinition} colorDefinition
 * @param {function} cb Called on finished with params (error, ColorValue|null)
 */
ColorData.prototype.getColorValue = function(txId, outIndex, colorDefinition, cb) {
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

    _this.blockchain.getTx(txId, function(error, tx) {
      if (error !== null) {
        cb(error)
        return
      }

      colorDefinition.getAffectingInputs(tx, [outIndex], _this.blockchain, function(error, inputs) {
        if (error === null)
          runProcesses(tx, inputs, 0)
        else
          cb(error)
      })
    })

    function runProcesses(tx, inputs, index) {
      if (index === inputs.length) {
        _this.scanTx(tx, null, colorDefinition, cb)
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


module.exports = ColorData
