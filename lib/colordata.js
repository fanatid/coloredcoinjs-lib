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
  return this._storage.get({txid: txid, vout: vout, colorId: colorId})
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

/**
 * @param {bitcore.Transaction} tx
 * @param {IColorDefinition} cdef
 * @param {getTxFn} getTxFn
 * @return {Promise.<(?ColorValue)[]>}
 */
ColorData.prototype._getColorOutputsOrScan = function (tx, cdef, getTxFn) {
  var self = this

  var txid = tx.id
  function getOutputValues () {
    return Promise.map(tx.outputs, function (output, vout) {
      return self._getColorValue(txid, vout, cdef)
    })
  }

  // only one process for one tx at one moment
  if (self._scannedTx[txid] === undefined) {
    var process = getOutputValues()
      .then(function (cOutputValues) {
        // return if already scanned
        if (_.any(cOutputValues)) {
          return cOutputValues
        }

        var colorId = cdef.getColorId()
        var getTx = Promise.promisify(getTxFn)
        var getAffectingInputs = cdef.constructor.getAffectingInputs
        // get all affecting inputs
        return getAffectingInputs(tx, _.range(tx.outputs.length), getTxFn)
          .then(function (ainputs) {
            // scan all affecting inputs
            return Promise.map(ainputs, function (ainput) {
              var itxid = tx.inputs[ainput].prevTxId.toString('hex')
              var data = {
                txid: itxid,
                vout: tx.inputs[ainput].outputIndex,
                colorId: colorId
              }
              // already exists for this color definition?
              return self._storage.get(data)
                .then(function (value) {
                  if (value !== null) {
                    return
                  }

                  // scan previous affecting tx
                  return getTx(itxid)
                    .then(function (rawtx) {
                      var tx = bitcore.Transaction(rawtx)
                      return self._getColorOutputsOrScan(tx, cdef, getTxFn)
                    })
                })
            })
          })
          .then(function () {
            // get all input color values
            return Promise.map(tx.inputs, function (input) {
              var itxid = input.prevTxId.toString('hex')
              var vout = input.outputIndex
              return self._getColorValue(itxid, vout, cdef)
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
                  return self._storage.add({
                    txid: txid,
                    vout: index,
                    colorId: cdef.getColorId(),
                    value: cvalue.getValue()
                  })
                })
              })
          })
          .then(getOutputValues)
      })

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
  return self._getColorOutputsOrScan(tx, cdef, getTxFn)
    .then(function (cOutputValues) {
      return Promise.map(tx.inputs, function (input) {
        var itxid = input.prevTxId.toString('hex')
        return self._getColorValue(itxid, input.outputIndex, cdef)
      })
      .then(function (cInputValues) {
        return {inputs: cInputValues, outputs: cOutputValues}
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
  return this._getColorOutputsOrScan(tx, cdef, getTxFn)
    .then(function (cOutputValues) {
      return cOutputValues[vout]
    })
}

/**
 * @param {string} txid
 * @return {Promise}
 */
ColorData.prototype.removeColorValues = function (txid) {
  return this._storage.remove(txid)
}

module.exports = ColorData
