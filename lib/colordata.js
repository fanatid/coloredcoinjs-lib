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
 * @param {number[]} vouts
 * @param {IColorDefinition} cdef
 * @param {getTxFn} getTxFn
 * @return {Promise.<(?ColorValue)[]>}
 */
ColorData.prototype._getColorOutputsOrScan = function (tx, vouts, cdef, getTxFn) {
  var self = this

  var txid = tx.id
  function getOutputValues () {
    return Promise.map(vouts, function (output, vout) {
      return self._getColorValue(txid, vout, cdef)
    })
  }

  var colorId = cdef.getColorId()
  var getTx = Promise.promisify(getTxFn)
  var getAffectingInputs = cdef.constructor.getAffectingInputs

  // only one process for one tx at one moment
  var processesKey = colorId + ':' + txid
  var processes = self._scannedTx[processesKey] || {}
  var process = vouts.reduce(function (process, vout) {
    return process || processes[vout]
  }, undefined)

  if (process === undefined) {
    process = getOutputValues()
      .then(function (cOutputValues) {
        // return if already scanned
        if (_.all(cOutputValues)) {
          return cOutputValues
        }

        // in other case filter unscanned output indices and try
        var voutsTodo = vouts.filter(function (vout) {
          return cOutputValues[vout] === null
        })

        // get all affecting inputs
        return getAffectingInputs(tx, voutsTodo, getTxFn)
          .then(function (ainputs) {
            // group by input txid
            var grouped = _.chain(ainputs)
              .map(function (ainput) {
                return {
                  txid: tx.inputs[ainput].prevTxId.toString('hex'),
                  vout: tx.inputs[ainput].outputIndex,
                  colorId: colorId
                }
              })
              .groupBy('txid')
              .values()
              .value()

            // scan all affecting inputs for voutsTodo
            return Promise.map(grouped, function (arr) {
              // filter unscanned inputs
              return Promise.filter(arr, function (data) {
                return self._storage.get(data)
                  .then(function (value) { return value === null })
              })
              .then(function (unscanned) {
                if (unscanned.length === 0) {
                  return
                }

                // scan previous affecting tx
                return getTx(unscanned[0].txid)
                  .then(function (rawtx) {
                    var tx = bitcore.Transaction(rawtx)
                    var vouts = _.pluck(unscanned, 'vout')
                    return self._getColorOutputsOrScan(tx, vouts, cdef, getTxFn)
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
      .finally(function () {
        // remove process for current outputs indices
        var processes = self._scannedTx[processesKey]
        vouts.forEach(function (vout) { delete processes[vout] })
        self._scannedTx[processesKey] = processes
        if (Object.keys(processes).length === 0) {
          delete self._scannedTx[processesKey]
        }
      })

    // save process for current output indices
    vouts.forEach(function (vout) { processes[vout] = process })
    self._scannedTx[processesKey] = processes
  }

  return process
}

/**
 * @param {bitcore.Transaction} tx
 * @param {?number[]} vouts `null` means all outputs
 * @param {IColorDefinition} cdef
 * @param {getTxFn} getTxFn
 * @return {Promise.<{inputs: (?ColorValue)[], outputs: (?ColorValue)[]}>}
 */
ColorData.prototype.getTxColorValues = function (tx, vouts, cdef, getTxFn) {
  var self = this
  return Promise.try(function () {
    if (vouts === null) {
      vouts = _.range(tx.outputs.length)
    }

    return self._getColorOutputsOrScan(tx, vouts, cdef, getTxFn)
      .then(function (cOutputValues) {
        var rcOutputValues = _.range(tx.outputs.length).map(function () {
          return null
        })
        vouts.forEach(function (vout, index) {
          rcOutputValues[vout] = cOutputValues[index]
        })

        return Promise.map(tx.inputs, function (input) {
          var itxid = input.prevTxId.toString('hex')
          return self._getColorValue(itxid, input.outputIndex, cdef)
        })
        .then(function (cInputValues) {
          return {inputs: cInputValues, outputs: rcOutputValues}
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
  return this._getColorOutputsOrScan(tx, [vout], cdef, getTxFn)
    .then(function (cOutputValues) {
      return cOutputValues[0]
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
