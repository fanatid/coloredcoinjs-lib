/* globals Promise:true */
var _ = require('lodash')
var Promise = require('bluebird')
var bitcore = require('bitcore')

var ColorValue = require('./colorvalue')

/**
 * @class ColorData
 * @param {ColorDataStorage} storage
 */
function ColorData (storage) {
  this._storage = storage
  this._scannedTx = {}
}

/**
 * Return ColorValue currently present in ColorDataStorage
 *
 * @param {string} txid
 * @param {number} vout
 * @param {IColorDefinition} cdef
 * @return {Promise.<?ColorValue>}
 */
ColorData.prototype._getColorValue = function (txid, vout, cdef) {
  var colorId = cdef.getColorId()
  return this._storage.getColorValues(txid, vout, colorId)
    .then(function (value) {
      if (value !== null) {
        value = new ColorValue(cdef, value)
      }

      return value
    })
}

/**
 * @param {bitcore.Transaction} tx
 * @param {IColorDefinition} cdef
 * @param {getTxFn} getTxFn
 * @return {Promise}
 */
ColorData.prototype._scanTx = function (tx, cdef, getTxFn) {
  var self = this

  // only one _scanTx for one tx at one moment
  var txid = tx.id
  if (self._scannedTx[txid] === undefined) {
    var colorId = cdef.getColorId()
    var getTx = Promise.promisify(getTxFn)
    // get all affecting inputs
    var getAffectingInputs = cdef.constructor.getAffectingInputs
    var process = getAffectingInputs(tx, _.range(tx.outputs.length), getTxFn)
      .then(function (ainputs) {
        // scan all affecting inputs
        return Promise.map(ainputs, function (ainput) {
          var input = tx.inputs[ainput]
          var itxid = input.prevTxId.toString('hex')
          var vout = input.outputIndex
          // already exists for this color definition?
          return self._storage.getColorValues(itxid, vout, colorId)
            .then(function (value) {
              if (value !== null) {
                return
              }

              // scan previous affecting tx
              return getTx(itxid)
                .then(function (rawtx) {
                  var tx = bitcore.Transaction(rawtx)
                  return self._scanTx(tx, cdef, getTxFn)
                })
            })
        })
      })
      .then(function () {
        // get all input color values
        return Promise.map(tx.inputs, function (input) {
          var itxid = input.prevTxId.toString('hex')
          var vout = input.outputIndex
          return self._storage.getColorValues(itxid, vout, colorId)
            .then(function (value) {
              if (value !== null) {
                value = new ColorValue(cdef, value)
              }

              return value
            })
        })
      })
      .then(function (inColorValues) {
        // input color values not found and tx isn't genesis
        if (!_.any(inColorValues) && !cdef.isGenesis(tx)) {
          return
        }

        // calculate output color values
        return cdef.runKernel(tx, inColorValues, getTxFn)
          .then(function (outColorValues) {
            return Promise.map(outColorValues, function (cvalue, index) {
              if (cvalue === null) {
                return
              }

              // and save
              return self._storage.addColorValue({
                txid: txid,
                vout: index,
                colorId: cdef.getColorId(),
                value: cvalue.getValue()
              })
            })
          })
      })
      .then(function () {})

    self._scannedTx[txid] = process
      .finally(function () { delete self._scannedTx[txid] })
  }

  return self._scannedTx[txid]
}

/**
 * @param {bitcore.Transaction} tx
 * @param {IColorDefinition} cdef
 * @param {getTxFn} getTxFn
 * @return {Promise.<{inputs: (?ColorValue)[], outputs: (?ColorValue)[]}>}
 */
ColorData.prototype.getTxColorValues = function (tx, cdef, getTxFn) {
  var self = this
  return Promise.try(function () {
    var txid = tx.id
    function getOutputValues () {
      return Promise.map(tx.outputs, function (output, vout) {
        return self._getColorValue(txid, vout, cdef)
      })
    }

    return getOutputValues()
      .then(function (cOutputValues) {
        if (_.any(cOutputValues)) {
          return cOutputValues
        }

        return self._scanTx(tx, cdef, getTxFn).then(getOutputValues)
      })
      .then(function (cOutputValues) {
        return Promise.map(tx.inputs, function (input) {
          var itxid = input.prevTxId.toString('hex')
          return self._getColorValue(itxid, input.outputIndex, cdef)
        })
        .then(function (cInputValues) {
          return {inputs: cInputValues, outputs: cOutputValues}
        })
      })
  })
}

/**
 * @param {bitcore.Transaction} tx
 * @param {number} vout
 * @param {IColorDefinition} cdef
 * @param {getTxFn} getTxFn
 * @return {Promise.<?ColorValue>}
 */
ColorData.prototype.getOutputColorValue = function (tx, vout, cdef, getTxFn) {
  var self = this
  return Promise.try(function () {
    var txid = tx.id
    function getOutputValues () {
      return Promise.map(tx.outputs, function (output, vout) {
        return self._getColorValue(txid, vout, cdef)
      })
    }

    return getOutputValues()
      .then(function (cOutputValues) {
        if (_.any(cOutputValues)) {
          return cOutputValues
        }

        return self._scanTx(tx, cdef, getTxFn).then(getOutputValues)
      })
      .then(function (cOutputValues) {
        return cOutputValues[vout]
      })
  })
}

/**
 * @param {string} txid
 * @param {number} vout
 * @return {Promise}
 */
ColorData.prototype.removeColorValues = function (txid, vout) {
  return this._storage.removeOutput(txid, vout)
}

module.exports = ColorData
