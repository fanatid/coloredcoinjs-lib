var Q = require('q')
var _ = require('lodash')

var ColorValue = require('./ColorValue')
var bitcoin = require('./bitcoin')
var verify = require('./verify')
var util = require('./util')


/**
 * @callback getTxFnCallback
 * @param {?Error} error
 * @param {external:bitcoinjs-lib.Transaction} tx
 */

/**
 * @function getTxFn
 * @param {string} txId
 * @param {getTxFnCallback} cb
 */


/**
 * @class ColorData
 * @param {ColorDataStorage} storage
 */
function ColorData(storage) {
  verify.ColorDataStorage(storage)

  this._storage = storage
}

/**
 * Return ColorValue currently present in ColorDataStorage
 *
 * @param {string} txId
 * @param {number} outIndex
 * @param {ColorDefinition} colorDefinition
 * @return {?ColorValue}
 */
ColorData.prototype.fetchColorValue = function (txId, outIndex, colorDefinition) {
  verify.txId(txId)
  verify.number(outIndex)
  verify.ColorDefinition(colorDefinition)

  var colorValue = this._storage.getValue({
    colorId: colorDefinition.getColorId(),
    txId: txId,
    outIndex: outIndex
  })
  if (colorValue === null) {
    return null
  }

  return new ColorValue(colorDefinition, colorValue)
}

/**
 * @callback ColorData~scanTxCallback
 * @param {?Error} error
 */

/**
 * Scan transaction to obtain color data for its outputs
 *
 * @param {external:bitcoinjs-lib.Transaction} tx
 * @param {?(number[])} outputIndices Save only this indices
 * @param {ColorDefinition} colorDefinition
 * @param {getTxFn} getTxFn
 * @param {ColorData~scanTxCallback} cb
 */
ColorData.prototype.scanTx = function (tx, outputIndices, colorDefinition, getTxFn, cb) {
  verify.Transaction(tx)
  if (outputIndices !== null) {
    verify.array(outputIndices)
    outputIndices.forEach(verify.number)
  }
  verify.ColorDefinition(colorDefinition)
  verify.function(getTxFn)
  verify.function(cb)

  var self = this

  return Q.fcall(function () {
    var inColorValues = tx.ins.map(function (input) {
      var inputTxId = Array.prototype.reverse.call(new Buffer(input.hash)).toString('hex')
      return self.fetchColorValue(inputTxId, input.index, colorDefinition)
    })

    if (!_.any(inColorValues) && !colorDefinition.isSpecialTx(tx)) {
      return
    }

    return Q.ninvoke(colorDefinition, 'runKernel', tx, inColorValues, getTxFn).then(function (outColorValues) {
      outColorValues.forEach(function (colorValue, index) {
        var skipAdd = colorValue === null || (outputIndices !== null && outputIndices.indexOf(index) === -1)
        if (skipAdd) {
          return
        }

        self._storage.add({
          colorId: colorDefinition.getColorId(),
          txId: tx.getId(),
          outIndex: index,
          value: colorValue.getValue()
        })
      })
    })

  }).done(function () { cb(null) }, function (error) { cb(error) })
}

/**
 * @callback ColorData~getColorValueCallback
 * @param {?Error} error
 * @param {?ColorValue} colorValue
 */

/**
 * For a given txId, outIndex and colorDefinition return ColorValue or null if
 *  colorDefinition not represented in given txOut
 *
 * @param {(string|external:bitcoinjs-lib.Transaction)} txId
 * @param {number} outIndex
 * @param {ColorDefinition} colorDefinition
 * @param {getTxFn} getTxFn
 * @param {ColorData~getColorValueCallback} cb
 */
ColorData.prototype.getColorValue = function (txId, outIndex, colorDefinition, getTxFn, cb) {
  var extraTx = {}
  if (txId instanceof bitcoin.Transaction) {
    extraTx[txId.getId()] = txId
    txId = txId.getId()
  }

  verify.txId(txId)
  verify.number(outIndex)
  verify.ColorDefinition(colorDefinition)
  verify.function(getTxFn)
  verify.function(cb)

  var self = this

  return Q.fcall(function () {
    var getAffectingInputs = Q.nbind(colorDefinition.constructor.getAffectingInputs)
    var scanTx = Q.nbind(self.scanTx, self)
    var scannedOutputs = {}

    function processOne(txId, outIndex) {
      if (!_.isUndefined(scannedOutputs[txId + outIndex])) { return }
      scannedOutputs[txId + outIndex] = true

      if (self._storage.getAnyValue({txId: txId, outIndex: outIndex}) !== null) {
        return
      }

      var txPromise = _.isUndefined(extraTx[txId]) ? Q.nfcall(getTxFn, txId) : Q(extraTx[txId])
      return txPromise.then(function (tx) {
        return getAffectingInputs(tx, [outIndex], getTxFn).then(function (inputs) {
          var promise = Q()

          inputs.forEach(function (input) {
            var inputTxId = Array.prototype.reverse.call(new Buffer(input.hash)).toString('hex')
            promise = promise.then(function () {
              return processOne(inputTxId, input.index)
            })
          })

          return promise.then(function () {
            return scanTx(tx, null, colorDefinition, getTxFn)
          })
        })
      })
    }

    return processOne(txId, outIndex)

  }).then(function () {
    return self.fetchColorValue(txId, outIndex, colorDefinition)

  }).done(function (colorValue) { cb(null, colorValue) }, function (error) { cb(error) })
}

ColorData.prototype.getColorValue = util.makeSerial(ColorData.prototype.getColorValue)

/**
 * @callback ColorData~getTxColorValuesCallback
 * @param {?Error} error
 * @param {Array.<?ColorValue>} colorValues
 */

/**
 * @param {external:bitcoinjs-lib.Transaction} tx
 * @param {ColorDefinition} colorDefinition
 * @param {getTxFn} getTxFn
 * @param {Object} [opts]
 * @param {boolean} [opts.save=true] Save color data for current tx
 * @param {ColorData~getTxColorValuesCallback} cb
 */
ColorData.prototype.getTxColorValues = function (tx, colorDefinition, getTxFn, opts, cb) {
  if (_.isFunction(opts) && _.isUndefined(cb)) {
    cb = opts
    opts = {}
  }
  opts = _.defaults(opts, {save: true})

  verify.Transaction(tx)
  verify.ColorDefinition(colorDefinition)
  verify.function(getTxFn)
  verify.object(opts)
  verify.boolean(opts.save)
  verify.function(cb)

  var self = this
  var getColorValue = Q.nbind(self.getColorValue, self)

  var promise
  if (opts.save) {
    promise = Q.all(tx.outs.map(function (output, outIndex) {
      return getColorValue(tx, outIndex, colorDefinition, getTxFn)
    }))

  } else {
    promise = Q.all(tx.ins.map(function (input) {
      var inputTxId = Array.prototype.reverse.call(new Buffer(input.hash)).toString('hex')
      return getColorValue(inputTxId, input.index, colorDefinition, getTxFn)

    })).then(function (inColorValues) {
      return Q.ninvoke(colorDefinition, 'runKernel', tx, inColorValues, getTxFn)

    })

  }

  promise.done(function (outColorValues) { cb(null, outColorValues) }, function (error) { cb(error) })
}

/**
 * @callback ColorData~getColorValuesForTxCallback
 * @param {?Error} error
 * @param {Array.<?ColorValue>} colorValues
 */

/**
 * @param {external:bitcoinjs-lib.Transaction} tx
 * @param {ColorDefinition} colorDefinition
 * @param {getTxFn} getTxFn
 * @param {ColorData~getColorValuesForTxCallback} cb
 */
ColorData.prototype.getColorValuesForTx = function (tx, colorDefinition, getTxFn, cb) {
  console.warn('ColorData.getColorValuesForTx deprecated for removal in 1.0.0, use ColorData.getTxColorValues')

  verify.Transaction(tx)
  verify.ColorDefinition(colorDefinition)
  verify.function(getTxFn)
  verify.function(cb)

  var self = this

  var inColorValuesPromises = tx.ins.map(function (input) {
    var txId = Array.prototype.reverse.call(new Buffer(input.hash)).toString('hex')
    return Q.ninvoke(self, 'getColorValue', txId, input.index, colorDefinition, getTxFn)
  })

  Q.all(inColorValuesPromises).then(function (inColorValues) {
    return Q.ninvoke(colorDefinition, 'runKernel', tx, inColorValues, getTxFn)

  }).done(function (outColorValues) { cb(null, outColorValues) }, function (error) { cb(error) })
}

/**
 * @param {string} txId
 * @param {number} outIndex
 */
ColorData.prototype.removeColorValues = function (txId, outIndex) {
  verify.txId(txId)
  verify.number(outIndex)

  return this._storage.remove({txId: txId, outIndex: outIndex})
}


module.exports = ColorData
