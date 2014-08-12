var assert = require('assert')

var _ = require('lodash')

var BlockchainStateBase = require('../blockchain').BlockchainStateBase
var ColorDefinition = require('./ColorDefinition')
var ColorValue = require('./ColorValue')
var ColorDataStorage = require('../storage').ColorDataStorage
var Transaction = require('../tx').Transaction


/**
 * @class ColorData
 *
 * Color data which needs access to the blockchain state up to the genesis of color
 *
 * @param {ColorDataStorage} storage
 * @param {blockchain.BlockchainStateBase} blockchain
 */
function ColorData(storage, blockchain) {
  assert(storage instanceof ColorDataStorage,
    'Expected storage instance of ColorDataStorage, got ' + storage)
  assert(blockchain instanceof BlockchainStateBase,
    'Expected blockchain instance of BlockchainStateBase, got ' + blockchain)

  this.storage = storage
  this.blockchain = blockchain
}

/**
 * Return ColorValue currently present in ColorDataStorage
 *
 * @param {string} txId
 * @param {number} outIndex
 * @param {ColorDefinition} colorDefinition
 * @return {ColorValue|null}
 */
ColorData.prototype.fetchColorValue = function(txId, outIndex, colorDefinition) {
  assert(Transaction.isTxId(txId), 'Expected transactionId txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(colorDefinition instanceof ColorDefinition,
    'Expected ColorDefinition colorDefinition, got ' + colorDefinition)

  var colorValue = null

  var colorData = this.storage.get({
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
 * @param {ColorDefinition} colorDefinition
 * @param {function} cb Called on finished with params (error)
 */
ColorData.prototype.scanTx = function(tx, outputIndices, colorDefinition, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isArray(outputIndices) || _.isNull(outputIndices), 'Expected Array|null outputIndices, got ' + outputIndices)
  if (_.isArray(outputIndices))
    assert(outputIndices.every(function(oi) { return _.isNumber(oi) }),
      'Expected outputIndices Array numbers, got ' + outputIndices)
  assert(colorDefinition instanceof ColorDefinition,
    'Expected ColorDefinition colorDefinition, got ' + colorDefinition)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  var inColorValues = []
  var empty = true

  tx.ins.forEach(function(input) {
    var colorData = _this.storage.get({
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
            _this.storage.add({
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
 * @param {ColorDefinition} colorDefinition
 * @param {function} cb Called on finished with params (error, ColorValue|null)
 */
ColorData.prototype.getColorValue = function(txId, outIndex, colorDefinition, cb) {
  assert(Transaction.isTxId(txId), 'Expected transactionId txId, got ' + txId)
  assert(_.isNumber(outIndex), 'Expected number outIndex, got ' + outIndex)
  assert(colorDefinition instanceof ColorDefinition,
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
