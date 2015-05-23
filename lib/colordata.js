/* globals Promise:true */
var _ = require('lodash')
var Promise = require('bluebird')
var LRU = require('lru-cache')
var makeConcurrent = require('make-concurrent')(Promise)

var ColorValue = require('./colorvalue')
var bitcoin = require('./bitcoin')

/**
 * Reverse buffer and transform to hex string
 * @param {Buffer} s
 * @return {string}
 */
function hashEncode (s) {
  return Array.prototype.reverse.call(new Buffer(s)).toString('hex')
}

/**
 * @callback getTxFnCallback
 * @param {?Error} err
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
 * @param {Object} [opts]
 * @param {number} [opts.cacheSize=100]
 */
function ColorData (storage, opts) {
  opts = _.extend({
    cacheSize: 1000
  }, opts)

  this._storage = storage
  this._cachedValues = LRU({max: opts.cacheSize, stale: true})
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
  var colorValue = this._storage.getValue({
    colorId: colorDefinition.getColorId(),
    txId: txId,
    outIndex: outIndex
  })

  if (colorValue !== null) {
    colorValue = new ColorValue(colorDefinition, colorValue)
  }

  return colorValue
}

/**
 * @callback ColorData~scanTxCallback
 * @param {?Error} err
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
  var self = this

  return Promise.try(function () {
    var inColorValues = tx.ins.map(function (input) {
      var inputTxId = hashEncode(input.hash)
      return self.fetchColorValue(inputTxId, input.index, colorDefinition)
    })

    if (!_.any(inColorValues) && !colorDefinition.isSpecialTx(tx)) {
      return
    }

    return colorDefinition.runKernel(tx, inColorValues, getTxFn)
      .then(function (outColorValues) {
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
  })
  .asCallback(cb)
}

/**
 * @callback ColorData~getColorValueCallback
 * @param {?Error} err
 * @param {?ColorValue} colorValue
 */

/**
 * For a given txId, outIndex and colorDefinition return ColorValue or null if
 *  colorDefinition not represented in given txOut
 *
 * @param {Object} coin
 * @param {(string|external:bitcoinjs-lib.Transaction)} coin.txId
 * @param {number} coin.outIndex
 * @param {ColorDefinition} colorDefinition
 * @param {getTxFn} getTxFn
 * @param {ColorData~getColorValueCallback} cb
 */
ColorData.prototype.getCoinColorValue = makeConcurrent(function (coin, colorDefinition, getTxFn, cb) {
  var self = this

  var extraTx = {}
  if (coin.txId instanceof bitcoin.Transaction) {
    extraTx[coin.txId.getId()] = coin.txId
    coin.txId = coin.txId.getId()
  }

  var cacheKey = [coin.txId, coin.outIndex, colorDefinition.getColorId()].join(',')
  if (self._cachedValues.has(cacheKey) === false) {
    var getTx = Promise.promisify(getTxFn)
    var promise = Promise.try(function () {
      var getAffectingInputs = colorDefinition.constructor.getAffectingInputs
      var scannedOutputs = {}

      // move to prototype func ?
      function processOne (txId, outIndex) {
        if (!_.isUndefined(scannedOutputs[txId + outIndex])) { return }
        scannedOutputs[txId + outIndex] = true

        if (self._storage.getAnyValue({txId: txId, outIndex: outIndex}) !== null) {
          return
        }

        return Promise.try(function () {
          if (extraTx[txId] === undefined) {
            return getTx(txId)
              .then(function (rawtx) {
                return bitcoin.Transaction.fromHex(rawtx)
              })
          }

          return extraTx[txId]
        })
        .then(function (tx) {
          return getAffectingInputs(tx, [outIndex], getTxFn)
            .then(function (inputs) {
              return Promise.map(inputs, function (input) {
                var inputTxId = hashEncode(input.hash)
                return processOne(inputTxId, input.index)
              })
              .then(function () {
                return self.scanTx(tx, null, colorDefinition, getTxFn)
              })
            })
        })
      }

      return processOne(coin.txId, coin.outIndex)
    })
    .then(function () {
      return self.fetchColorValue(coin.txId, coin.outIndex, colorDefinition)
    })

    self._cachedValues.set(cacheKey, promise)
  }

  return self._cachedValues.get(cacheKey).asCallback(cb)
})

/**
 * @param {(string|external:bitcoinjs-lib.Transaction)} txId
 * @param {number} outIndex
 * @param {ColorDefinition} colorDefinition
 * @param {getTxFn} getTxFn
 * @param {ColorData~getColorValueCallback} cb
 */
ColorData.prototype.getColorValue = function (txId, outIndex, colorDefinition, getTxFn, cb) {
  console.warn('ColorData.getColorValue deprecated for removal in v1.0.0, ' +
               'use Colordata.getCoinColorValue')

  var coin = {txId: txId, outIndex: outIndex}
  return this.getCoinColorValue(coin, colorDefinition, getTxFn, cb)
}

/**
 * @callback ColorData~getTxColorValuesCallback
 * @param {?Error} err
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

  var self = this
  return Promise.try(function () {
    if (opts.save) {
      return Promise.all(tx.outs, function (output, outIndex) {
        var coin = {txId: tx, outIndex: outIndex}
        return self.getCoinColorValue(coin, colorDefinition, getTxFn)
      })
    }

    return Promise.map(tx.ins, function (input) {
      var coin = {
        txId: hashEncode(input.hash),
        outIndex: input.index
      }
      return self.getCoinColorValue(coin, colorDefinition, getTxFn)

    })
    .then(function (inColorValues) {
      return colorDefinition.runKernel(tx, inColorValues, getTxFn)
    })
  })
  .then(function (outColorValues) {
    var txId = tx.getId()
    outColorValues.forEach(function (colorValue, index) {
      var cacheKey = [txId, index, colorDefinition.getColorId()].join(',')
      self._cachedValues.set(cacheKey, Promise.resolve(colorValue))
    })

    return outColorValues
  })
  .asCallback(cb)
}

/**
 * @callback ColorData~getColorValuesForTxCallback
 * @param {?Error} err
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

  var self = this
  return Promise.map(tx.ins, function (input) {
    var coin = {
      txId: hashEncode(input.hash),
      outIndex: input.index
    }
    return self.getCoinColorValue(coin, colorDefinition, getTxFn)
  })
  .then(function (inColorValues) {
    return colorDefinition.runKernel(tx, inColorValues, getTxFn)
  })
  .asCallback(cb)
}

/**
 * @param {string} txId
 * @param {number} outIndex
 */
ColorData.prototype.removeColorValues = function (txId, outIndex) {
  return this._storage.remove({txId: txId, outIndex: outIndex})
}

module.exports = ColorData
