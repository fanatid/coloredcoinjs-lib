/* globals Promise:true */
var _ = require('lodash')
var Promise = require('bluebird')
var bitcore = require('bitcore')

var jsUtil = require('./util/js')
var ColorValue = require('./colorvalue')

/**
 * @class ColorData
 * @param {storage.ColorData.Interface} storage
 * @param {definitions.Manager} cdmanager
 */
function ColorData (storage, cdmanager) {
  this._storage = storage
  this._cdmanager = cdmanager
  this._scanProcesses = {}
}

/**
 * @typedef ColorData~_getColorOutputOrScanOutput
 * @property {definitions.IColorDefinition} cdef
 * @property {ColorValue} outputs
 */

/**
 * @param {bitcore.Transaction} tx
 * @param {number[]} oidxs
 * @param {definitions.IColorDefinition} cdefCls
 * @param {getTxFn} getTxFn
 * @param {Object} [opts]
 * @param {boolean} [opts.save=true]
 * @return {Promise.<ColorData~_getColorOutputOrScanOutput[]>}
 */
ColorData.prototype._getColorOutputsOrScan =
function (tx, oidxs, cdefCls, getTxFn, opts) {
  var self = this

  var txid = tx.id
  var colorCode = cdefCls.getColorCode()
  var getTx = Promise.promisify(getTxFn)
  var save = Object(opts).save !== false

  // only one process for one tx at one moment
  var processesKey = tx.id + ':' + colorCode
  var process = Promise.try(function () {
    function tryLock () {
      // save current process and return
      //   if not scan current tx with color code now
      if (self._scanProcesses[processesKey] === undefined) {
        self._scanProcesses[processesKey] = process
        return
      }

      // maybe in next time...
      return self._scanProcesses[processesKey].finally(tryLock)
    }

    return tryLock()
  })
  .then(function () {
    // get color values from storage
    var opts = {colorCode: colorCode, txid: tx.id}
    if (oidxs.length === 1) {
      opts.oidx = oidxs[0]
    }

    return self._storage.get(opts)
  })
  .then(function (data) {
    // check data for every oidx
    return Promise.reduce(oidxs, function (rows, oidx) {
      // have we value for this oidx?
      var values = data[oidx]
      if (values === undefined) {
        return rows
      }

      // collect all color values for this oidx
      return Promise.map(_.keys(values), function (colorId) {
        return Promise.try(function () {
          var row = rows[colorId]
          if (row !== undefined) {
            return row
          }

          // cdef undefined yet, resolve
          return self._cdmanager.get({id: parseInt(colorId, 10)})
            .then(function (cdef) {
              return {
                cdef: cdef,
                outputs: jsUtil.getArrayOfNull(tx.outputs.length)
              }
            })
        })
        .then(function (row) {
          // create color values and remember
          row.outputs[oidx] = new ColorValue(row.cdef, values[colorId])
          rows[colorId] = row
        })
      }, {concurrency: 1})
      .then(function () { return rows })
    }, {})
    .then(function (rows) {
      // update oidxs
      var oidxsNew = _.difference(oidxs, _.keys(data).map(function (value) {
        return parseInt(value, 10)
      }))
      return [rows, oidxsNew]
    })
  })
  .spread(function (result, oidxs) {
    // return if have values for each input oidx
    if (oidxs.length === 0) {
      return _.values(result)
    }

    // extract affecting inputs for each output index
    return cdefCls.getAffectingInputs(tx, oidxs, getTxFn)
      .then(function (ainputs) {
        if (ainputs.length === 0) {
          // haven't affecting inputs in tx, may be it's genesis?
          return cdefCls.fromTx(tx, self._cdmanager)
            .then(function (cdef) {
              if (cdef === null) {
                return []
              }

              return [{
                cdef: cdef,
                inputs: jsUtil.getArrayOfNull(tx.inputs.length)
              }]
            })
        }

        // group all affecting inputs by previous txid
        var inputss = _.chain(ainputs)
          .map(function (ainput) {
            return {
              ainput: ainput,
              txid: tx.inputs[ainput].prevTxId.toString('hex'),
              oidx: tx.inputs[ainput].outputIndex
            }
          })
          .groupBy('txid')
          .values()
          .value()

        // scan all affecting input transactions
        var rows = {}
        return Promise.map(inputss, function (inputs) {
          return getTx(inputs[0].txid)
            .then(function (rawtx) {
              var tx = new bitcore.Transaction(rawtx)
              var oidxs = _.pluck(inputs, 'oidx')
              return self._getColorOutputsOrScan(tx, oidxs, cdefCls, getTxFn)
            })
            .then(function (items) {
              // save color values of affecting input transactions to rows
              if (items.length === 0) {
                return
              }

              items.forEach(function (item) {
                var row = rows[item.cdef.getColorId()]
                if (row === undefined) {
                  row = {
                    cdef: item.cdef,
                    inputs: jsUtil.getArrayOfNull(tx.inputs.length)
                  }
                }

                inputs.forEach(function (input) {
                  row.inputs[input.ainput] = item.outputs[input.oidx]
                })

                rows[item.cdef.getColorId()] = row
              })
            })
        })
        .then(function () { return _.values(rows) })
      })
      .then(function (rows) {
        // run runKernel for each color definition
        return Promise.map(rows, function (row) {
          var colorId = row.cdef.getColorId()
          return row.cdef.runKernel(tx, row.inputs, getTxFn)
            .then(function (outColorValues) {
              // skip saving data if not need this
              if (!save) {
                return
              }

              // save each color value
              return Promise.map(outColorValues, function (cvalue, oidx) {
                if (cvalue === null) {
                  return
                }

                return self._storage.add({
                  colorCode: colorCode,
                  txid: txid,
                  oidx: oidx,
                  colorId: colorId,
                  value: cvalue.getValue()
                })
              })
              .then(function () {
                // output format
                return {cdef: row.cdef, outputs: outColorValues}
              })
            })
        })
      })
      .then(function (rows) {
        // add found color values to result
        rows.forEach(function (row) {
          var colorId = row.cdef.getColorId()

          var item = result[colorId]
          if (item === undefined) {
            if (_.any(row.outputs)) {
              result[colorId] = row
            }
            return
          }

          row.outputs.forEach(function (output, index) {
            if (output !== null) {
              item[index] = output
            }
          })

          result[colorId] = item
        })

        return _.values(result)
      })
  })
  .finally(function () {
    // unlock current tx with color code
    delete self._scanProcesses[processesKey]
  })

  return process
}

/**
 * @param {bitcore.Transaction} tx
 * @param {defintions.IColorDefinition} cdefCls
 * @param {getTxFn} getTxFn
 * @return {Promise}
 */
ColorData.prototype.fullScanTx = function (tx, cdefCls, getTxFn) {
  var self = this
  return Promise.try(function () {
    var oidxs = _.range(tx.outputs.length)
    return self._getColorOutputsOrScan(tx, oidxs, cdefCls, getTxFn)
  })
  .then(_.noop)
}

/**
 * @param {bitcore.Transaction} tx
 * @param {?number[]} oidxs `null` means all outputs
 * @param {definitions.IColorDefinition} cdefCls
 * @param {getTxFn} getTxFn
 * @param {Object} [opts]
 * @param {boolean} [opts.save=true]
 * @return {Promise.<{inputs: ColorValue[][], outputs: ColorValue[][]}>}
 */
ColorData.prototype.getTxColorValues =
function (tx, oidxs, cdefCls, getTxFn, opts) {
  var self = this
  return Promise.try(function () {
    if (oidxs === null) {
      oidxs = _.range(tx.outputs.length)
    }

    return self._getColorOutputsOrScan(tx, oidxs, cdefCls, getTxFn, opts)
      .then(function (cOutputValues) {
        var colorCode = cdefCls.getColorCode()
        return Promise.map(tx.inputs, function (input) {
          return self._storage.get({
            colorCode: colorCode,
            txid: input.prevTxId.toString('hex'),
            oidx: input.outputIndex
          })
          .then(function (data) {
            var value = data[input.outputIndex]
            if (value === undefined) {
              return null
            }

            return value
          })
        })
        .then(function (rawInputValues) {
          var cdefs = _.zipObject(cOutputValues.map(function (item) {
            return [item.cdef.getColorId(), item.cdef]
          }))
          return Promise.reduce(rawInputValues, function (rows, values, index) {
            if (values === null) {
              return rows
            }

            return Promise.map(_.keys(values), function (colorId) {
              return Promise.try(function () {
                if (rows[colorId] !== undefined) {
                  return
                }

                return Promise.try(function () {
                  if (cdefs[colorId] !== undefined) {
                    return cdefs[colorId]
                  }

                  return self._cdmanager.get({id: parseInt(colorId, 10)})
                })
                .then(function (cdef) {
                  rows[colorId] = {
                    cdef: cdef,
                    inputs: jsUtil.getArrayOfNull(tx.inputs.length)
                  }
                })
              })
              .then(function () {
                var row = rows[colorId]
                row.inputs[index] = new ColorValue(row.cdef, values[colorId])
              })
            }, {concurrency: 1})
            .then(function () { return rows })
          }, {})
        })
        .then(function (result) {
          return {inputs: _.values(result), outputs: cOutputValues}
        })
      })
  })
}

/**
 * @param {bitcore.Transaction} tx
 * @param {number} oidx
 * @param {definitions.IColorDefinition} cdefCls
 * @param {getTxFn} getTxFn
 * @param {Object} [opts]
 * @param {boolean} [opts.save=true]
 * @return {Promise.<ColorValue[]>}
 */
ColorData.prototype.getOutputColorValue =
function (tx, oidx, cdefCls, getTxFn, opts) {
  return this._getColorOutputsOrScan(tx, [oidx], cdefCls, getTxFn, opts)
    .then(function (rows) {
      return rows.reduce(function (result, row) {
        if (row.outputs[oidx] !== null) {
          result.push(row.outputs[oidx])
        }

        return result
      }, [])
    })
}

/**
 * @param {string} txid
 * @param {definitions.IColorDefinition} cdefCls
 * @return {Promise}
 */
ColorData.prototype.removeColorValues = function (txid, cdefCls) {
  var self = this
  return Promise.try(function () {
    var opts = {colorCode: cdefCls.getColorCode(), txid: txid}
    return self._storage.remove(opts)
  })
}

module.exports = ColorData
