import _ from 'lodash'
import bitcore from 'bitcore'

import ColorValue from './colorvalue'
import { getArrayOfNull, promisify } from './util/js'

/**
 * @class ColorData
 */
export default class ColorData {
  /**
   * @constructor
   * @param {storage.ColorData.Interface} storage
   * @param {definitions.Manager} cdmanager
   */
  constructor (storage, cdmanager) {
    this._storage = storage
    this._cdmanager = cdmanager
    this._scanProcesses = new Map()
  }

  /**
   * @private
   * @param {string} key
   * @param {function} fn
   * @return {Promise}
   */
  async _scheduleScanProcess (key, fn) {
    if (this._scanProcesses.has(key)) {
      await new Promise((resolve) => {
        this._scanProcesses.get(key).push({resolve: resolve})
      })
    } else {
      this._scanProcesses.set(key, [])
    }

    try {
      return await fn()
    } finally {
      if (this._scanProcesses.get(key).length > 0) {
        this._scanProcesses.get(key).shift().resolve()
      } else {
        this._scanProcesses.delete(key)
      }
    }
  }

  /**
   * @private
   * @param {bitcore.Transaction} tx
   * @param {number[]}
   * @param {definitions.IColorDefinition} cdefCls
   * @param {getTxFn} getTxFn
   * @return {Promise.<Array.<{cdef: IColorDefinition, inputs: ColorValue[]}>>}
   */
  async _getAffectingInputs (tx, oidxs, cdefCls, getTxFn) {
    let ainputs = await cdefCls.getAffectingInputs(tx, oidxs, getTxFn)

    // haven't affecting inputs in tx, may be it's genesis?
    if (ainputs.length === 0) {
      let cdef = await cdefCls.fromTx(tx, this._cdmanager)
      if (cdef === null) {
        return []
      }

      return [{
        cdef: cdef,
        inputs: getArrayOfNull(tx.inputs.length)
      }]
    }

    // group all affecting inputs by previous txid
    let inputss = _.chain(ainputs)
      .map((ainput) => {
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
    let getTx = promisify(getTxFn)
    let rows = {}
    await* inputss.map(async (inputs) => {
      let rawtx = await getTx(inputs[0].txid)
      let inputTx = new bitcore.Transaction(rawtx)
      let inputOidxs = _.pluck(inputs, 'oidx')
      let items = await this._getColorOutputsOrScan(
        inputTx, inputOidxs, cdefCls, getTxFn)

      // save color values of affecting input transactions to rows
      if (items.length === 0) {
        return
      }

      for (let item of items) {
        let row = rows[item.cdef.getColorId()]
        if (row === undefined) {
          row = {
            cdef: item.cdef,
            inputs: getArrayOfNull(tx.inputs.length)
          }
        }

        for (let input of inputs) {
          row.inputs[input.ainput] = item.outputs[input.oidx]
        }

        rows[item.cdef.getColorId()] = row
      }
    })

    return _.values(rows)
  }

  /**
   * @private
   * @param {bitcore.Transaction} tx
   * @param {number[]} oidxs
   * @param {definitions.IColorDefinition} cdefCls
   * @param {getTxFn} getTxFn
   * @param {Object} [opts]
   * @param {boolean} [opts.save=true]
   * @return {Promise.<Array.<{cdef: IColorDefinition, outputs: ColorValue[]}>>}
   */
  _getColorOutputsOrScan (tx, oidxs, cdefCls, getTxFn, opts) {
    let txid = tx.id
    let colorCode = cdefCls.getColorCode()
    let save = Object(opts).save !== false

    // only one process for one tx at one moment
    return this._scheduleScanProcess(`${tx.id}:${colorCode}`, async () => {
      // get color values from storage
      let opts = {colorCode: colorCode, txid: tx.id}
      if (oidxs.length === 1) {
        opts.oidx = oidxs[0]
      }

      let colorData = await this._storage.get(opts)

      let colorOutputs = {}
      // check data for every oidx
      for (let oidx of oidxs) {
        // have we value for this oidx?
        let ovalues = colorData.get(oidx)
        if (ovalues === undefined) {
          continue
        }

        // collect all color values for this oidx
        for (let [colorId, value] of ovalues.entries()) {
          let row = colorOutputs[colorId]
          if (row === undefined) {
            // cdef undefined yet, resolve
            let cdef = await this._cdmanager.get({id: colorId})
            // and define row
            row = {
              cdef: cdef,
              outputs: getArrayOfNull(tx.outputs.length)
            }
          }

          // create color values and remember
          row.outputs[oidx] = new ColorValue(row.cdef, value)
          colorOutputs[colorId] = row
        }
      }

      // update oidxs
      oidxs = _.difference(oidxs, Array.from(colorData.keys()))

      // return if have values for each input oidx
      if (oidxs.length === 0) {
        return _.values(colorOutputs)
      }

      // extract affecting inputs for each output index
      let colorInputs = await this._getAffectingInputs(
        tx, oidxs, cdefCls, getTxFn)

      // run runKernel for each color definition
      let newColorValues = await* colorInputs.map(async (item) => {
        let colorId = item.cdef.getColorId()
        let outColorValues = await item.cdef.runKernel(tx, item.inputs, getTxFn)
        // saving data if need this
        if (save) {
          // save each color value
          await* outColorValues.map(async (cvalue, oidx) => {
            if (cvalue === null) {
              return
            }

            await this._storage.add({
              colorCode: colorCode,
              txid: txid,
              oidx: oidx,
              colorId: colorId,
              value: cvalue.getValue()
            })
          })
        }

        // output format
        return {cdef: item.cdef, outputs: outColorValues}
      })

      // add found color values to colorOutputs
      for (let item of newColorValues) {
        let colorId = item.cdef.getColorId()

        let colorOutput = colorOutputs[colorId]
        if (colorOutput === undefined) {
          if (_.any(item.outputs)) {
            colorOutputs[colorId] = item
          }
          continue
        }

        for (let index = 0; index < item.outputs.length; ++index) {
          if (item.outputs[index] !== null) {
            colorOutput[index] = item.outputs[index]
          }
        }

        colorOutputs[colorId] = colorOutput
      }

      return _.values(colorOutputs)
    })
  }

  /**
   * @param {bitcore.Transaction} tx
   * @param {defintions.IColorDefinition} cdefCls
   * @param {getTxFn} getTxFn
   * @return {Promise}
   */
  async fullScanTx (tx, cdefCls, getTxFn) {
    let oidxs = _.range(tx.outputs.length)
    await this._getColorOutputsOrScan(tx, oidxs, cdefCls, getTxFn)
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
  async getTxColorValues (tx, oidxs, cdefCls, getTxFn, opts) {
    if (oidxs === null) {
      oidxs = _.range(tx.outputs.length)
    }

    let cOutputValues = await this._getColorOutputsOrScan(
      tx, oidxs, cdefCls, getTxFn, opts)

    let colorCode = cdefCls.getColorCode()
    let rawInputValues = await* tx.inputs.map(async (input) => {
      let data = await this._storage.get({
        colorCode: colorCode,
        txid: input.prevTxId.toString('hex'),
        oidx: input.outputIndex
      })

      let value = data.get(input.outputIndex)
      if (value === undefined) {
        return null
      }

      return value
    })

    let cdefs = _.zipObject(cOutputValues.map((item) => {
      return [item.cdef.getColorId(), item.cdef]
    }))

    let rows = {}
    for (let index = 0; index < rawInputValues.length; ++index) {
      let values = rawInputValues[index]
      if (values === null) {
        continue
      }

      for (let [colorId, value] of values.entries()) {
        if (rows[colorId] === undefined) {
          let cdef = cdefs[colorId]
          if (cdef === undefined) {
            cdef = await this._cdmanager.get({id: colorId})
          }

          rows[colorId] = {
            cdef: cdef,
            inputs: getArrayOfNull(tx.inputs.length)
          }
        }

        let row = rows[colorId]
        row.inputs[index] = new ColorValue(row.cdef, value)
      }
    }

    return {inputs: _.values(rows), outputs: cOutputValues}
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
  async getOutputColorValue (tx, oidx, cdefCls, getTxFn, opts) {
    let rows = await this._getColorOutputsOrScan(
      tx, [oidx], cdefCls, getTxFn, opts)

    return rows.reduce((result, row) => {
      if (row.outputs[oidx] !== null) {
        result.push(row.outputs[oidx])
      }

      return result
    }, [])
  }

  /**
   * @param {string} txid
   * @param {definitions.IColorDefinition} cdefCls
   * @return {Promise}
   */
  async removeColorValues (txid, cdefCls) {
    let opts = {colorCode: cdefCls.getColorCode(), txid: txid}
    await this._storage.remove(opts)
  }
}
