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
 * @param {number} oidx
 * @param {IColorDefinition} cdef
 * @return {Promise.<?ColorValue>}
 */
ColorData.prototype._getColorValue = function (txid, oidx, cdef) {
  var colorId = cdef.getColorId()
  return this._storage.get({txid: txid, oidx: oidx, colorId: colorId})
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
 * @param {number[]} oidxs
 * @param {IColorDefinition} cdef
 * @param {getTxFn} getTxFn
 * @return {Promise.<(?ColorValue)[]>}
 */
ColorData.prototype._getColorOutputsOrScan = function (tx, oidxs, cdef, getTxFn) {
  var self = this

  var txid = tx.id
  function getOutputValues () {
    return Promise.map(oidxs, function (output, oidx) {
      return self._getColorValue(txid, oidx, cdef)
    })
  }

  var colorId = cdef.getColorId()
  var getTx = Promise.promisify(getTxFn)
  var getAffectingInputs = cdef.constructor.getAffectingInputs

  // only one process for one tx at one moment
  var processesKey = colorId + ':' + txid
  var processes = self._scannedTx[processesKey] || {}
  var process = oidxs.reduce(function (process, oidx) {
    return process || processes[oidx]
  }, undefined)

  if (process === undefined) {
    process = getOutputValues()
      .then(function (cOutputValues) {
        // return if already scanned
        if (_.all(cOutputValues)) {
          return cOutputValues
        }

        // in other case filter unscanned output indices and try
        var oidxsTodo = oidxs.filter(function (oidx) {
          return cOutputValues[oidx] === null
        })

        // get all affecting inputs
        return getAffectingInputs(tx, oidxsTodo, getTxFn)
          .then(function (ainputs) {
            // group by input txid
            var grouped = _.chain(ainputs)
              .map(function (ainput) {
                return {
                  txid: tx.inputs[ainput].prevTxId.toString('hex'),
                  oidx: tx.inputs[ainput].outputIndex,
                  colorId: colorId
                }
              })
              .groupBy('txid')
              .values()
              .value()

            // scan all affecting inputs for oidxsTodo
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
                    var oidxs = _.pluck(unscanned, 'oidx')
                    return self._getColorOutputsOrScan(tx, oidxs, cdef, getTxFn)
                  })
              })
            })
          })
          .then(function () {
            // get all input color values
            return Promise.map(tx.inputs, function (input) {
              var itxid = input.prevTxId.toString('hex')
              var oidx = input.outputIndex
              return self._getColorValue(itxid, oidx, cdef)
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
                    oidx: index,
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
        oidxs.forEach(function (oidx) { delete processes[oidx] })
        self._scannedTx[processesKey] = processes
        if (Object.keys(processes).length === 0) {
          delete self._scannedTx[processesKey]
        }
      })

    // save process for current output indices
    oidxs.forEach(function (oidx) { processes[oidx] = process })
    self._scannedTx[processesKey] = processes
  }

  return process
}

/**
 * @param {bitcore.Transaction} tx
 * @param {?number[]} oidxs `null` means all outputs
 * @param {IColorDefinition} cdef
 * @param {getTxFn} getTxFn
 * @return {Promise.<{inputs: (?ColorValue)[], outputs: (?ColorValue)[]}>}
 */
ColorData.prototype.getTxColorValues = function (tx, oidxs, cdef, getTxFn) {
  var self = this
  return Promise.try(function () {
    if (oidxs === null) {
      oidxs = _.range(tx.outputs.length)
    }

    return self._getColorOutputsOrScan(tx, oidxs, cdef, getTxFn)
      .then(function (cOutputValues) {
        var rcOutputValues = _.range(tx.outputs.length).map(function () {
          return null
        })
        oidxs.forEach(function (oidx, index) {
          rcOutputValues[oidx] = cOutputValues[index]
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
 * @param {number} oidx
 * @param {IColorDefinition} cdef
 * @param {getTxFn} getTxFn
 * @return {Promise.<?ColorValue>}
 */
ColorData.prototype.getOutputColorValue = function (tx, oidx, cdef, getTxFn) {
  return this._getColorOutputsOrScan(tx, [oidx], cdef, getTxFn)
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
