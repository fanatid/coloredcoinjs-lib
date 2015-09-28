import _ from 'lodash'
import bitcore from 'bitcore'
import { promisify } from 'promise-useful-utils'

import ColorValue from './colorvalue'
import { getArrayOfNull } from './util/js'

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
    this._scanProcesses = {}
  }

  /**
   * @private
   * @param {string} key
   * @param {function} fn
   * @return {Promise}
   */
  async _scheduleScanProcess (key, fn) {
    if (this._scanProcesses[key] === undefined) {
      this._scanProcesses[key] = []
    } else {
      await new Promise((resolve) => {
        this._scanProcesses[key].push({resolve: resolve})
      })
    }

    try {
      return await fn()
    } finally {
      if (this._scanProcesses[key].length > 0) {
        this._scanProcesses[key].shift().resolve()
      } else {
        delete this._scanProcesses[key]
      }
    }
  }

  /**
   * @private
   * @param {bitcore.Transaction} tx
   * @param {number[]} outIndices
   * @param {definitions.IColorDefinition} cdefCls
   * @param {getTxFn} getTxFn
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise.<Array.<{cdef: IColorDefinition, inputs: ColorValue[]}>>}
   */
  async _getAffectingInputs (tx, outIndices, cdefCls, getTxFn, opts) {
    let ainputs = await cdefCls.getAffectingInputs(tx, outIndices, getTxFn)

    // haven't affecting inputs in tx, may be it's genesis?
    if (ainputs.length === 0) {
      let cdef = await cdefCls.fromTx(tx, this._cdmanager, opts)
      if (cdef === null) {
        return []
      }

      return [{
        cdef: cdef,
        inputs: getArrayOfNull(tx.inputs.length)
      }]
    }

    // group all affecting inputs by previous txId
    let inputss = _.chain(ainputs)
      .map((ainput) => {
        return {
          ainput: ainput,
          txId: tx.inputs[ainput].prevTxId.toString('hex'),
          outIndex: tx.inputs[ainput].outputIndex
        }
      })
      .groupBy('txId')
      .values()
      .value()

    // scan all affecting input transactions
    let getTx = promisify(getTxFn)
    let rows = {}
    await* inputss.map(async (inputs) => {
      let rawtx = await getTx(inputs[0].txId)
      let inputTx = new bitcore.Transaction(rawtx)
      let inputOutIndices = _.pluck(inputs, 'outIndex')
      let items = await this._getColorOutputsOrScan(
        inputTx, inputOutIndices, cdefCls, getTxFn, opts)

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
          row.inputs[input.ainput] = item.outputs[input.outIndex]
        }

        rows[item.cdef.getColorId()] = row
      }
    })

    return _.values(rows)
  }

  /**
   * @private
   * @param {bitcore.Transaction} tx
   * @param {number[]} outIndices
   * @param {definitions.IColorDefinition} cdefCls
   * @param {getTxFn} getTxFn
   * @param {Object} [opts]
   * @param {boolean} [opts.save=true]
   * @param {Object} [opts.executeOpts]
   * @return {Promise.<Array.<{cdef: IColorDefinition, outputs: ColorValue[]}>>}
   */
  _getColorOutputsOrScan (tx, outIndices, cdefCls, getTxFn, opts) {
    let txId = tx.id
    let colorCode = cdefCls.getColorCode()
    let save = !!_.get(opts, 'save', true)
    let executeOpts = _.get(opts, 'executeOpts')

    // only one process for one tx at one moment
    return this._scheduleScanProcess(`${tx.id}:${colorCode}`, async () => {
      // get color values from storage
      let opts = {colorCode: colorCode, txId: tx.id}
      if (outIndices.length === 1) {
        opts.outIndex = outIndices[0]
      }

      let colorData = await this._storage.get(opts, {executeOpts: executeOpts})

      let colorOutputs = {}
      // check data for every outIndex
      for (let outIndex of outIndices) {
        // have we value for this outIndex?
        let ovalues = colorData.get(outIndex)
        if (ovalues === undefined) {
          continue
        }

        // collect all color values for this outIndex
        for (let [colorId, value] of ovalues.entries()) {
          let row = colorOutputs[colorId]
          if (row === undefined) {
            // cdef undefined yet, resolve
            let cdef = await this._cdmanager.get({id: colorId}, {executeOpts: executeOpts})
            // and define row
            row = {
              cdef: cdef,
              outputs: getArrayOfNull(tx.outputs.length)
            }
          }

          // create color values and remember
          row.outputs[outIndex] = new ColorValue(row.cdef, value)
          colorOutputs[colorId] = row
        }
      }

      // update outIndices
      outIndices = _.difference(outIndices, Array.from(colorData.keys()))

      // return if have values for each input outIndex
      if (outIndices.length === 0) {
        return _.values(colorOutputs)
      }

      // extract affecting inputs for each output index
      let colorInputs = await this._getAffectingInputs(
        tx, outIndices, cdefCls, getTxFn, {executeOpts: executeOpts})

      // run runKernel for each color definition
      let newColorValues = await* colorInputs.map(async (item) => {
        let colorId = item.cdef.getColorId()
        let outColorValues = await item.cdef.runKernel(tx, item.inputs, getTxFn)
        // saving data if need this
        if (save) {
          // save each color value
          await* outColorValues.map(async (cvalue, outIndex) => {
            if (cvalue === null) {
              return
            }

            await this._storage.add({
              colorCode: colorCode,
              txId: txId,
              outIndex: outIndex,
              colorId: colorId,
              value: cvalue.getValue()
            }, {executeOpts: executeOpts})
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
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async fullScanTx (tx, cdefCls, getTxFn, opts) {
    let outIndices = _.range(tx.outputs.length)
    await this._getColorOutputsOrScan(tx, outIndices, cdefCls, getTxFn, opts)
  }

  /**
   * @param {bitcore.Transaction} tx
   * @param {?number[]} outIndices `null` means all outputs
   * @param {definitions.IColorDefinition} cdefCls
   * @param {getTxFn} getTxFn
   * @param {Object} [opts]
   * @param {boolean} [opts.save=true]
   * @param {Object} [opts.executeOpts]
   * @return {Promise.<{
   *   inputs: Array.<{cdef: IColorDefinition, inputs: ColorValue[]}>,
   *   outputs: Array.<{cdef: IColorDefinition, outputs: ColorValue[]}>
   *  }>}
   */
  async getTxColorValues (tx, outIndices, cdefCls, getTxFn, opts) {
    if (outIndices === null) {
      outIndices = _.range(tx.outputs.length)
    }

    let executeOpts = _.get(opts, 'executeOpts')

    let cOutputValues = await this._getColorOutputsOrScan(
      tx, outIndices, cdefCls, getTxFn, opts)

    let colorCode = cdefCls.getColorCode()
    let rawInputValues = await* tx.inputs.map(async (input) => {
      let data = await this._storage.get({
        colorCode: colorCode,
        txId: input.prevTxId.toString('hex'),
        outIndex: input.outputIndex
      }, {executeOpts: executeOpts})

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
            cdef = await this._cdmanager.get(
              {id: colorId}, {executeOpts: executeOpts})
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
   * @param {number} outIndex
   * @param {definitions.IColorDefinition} cdefCls
   * @param {getTxFn} getTxFn
   * @param {Object} [opts]
   * @param {boolean} [opts.save=true]
   * @param {Object} [opts.executeOpts]
   * @return {Promise.<ColorValue[]>}
   */
  async getOutputColorValue (tx, outIndex, cdefCls, getTxFn, opts) {
    let rows = await this._getColorOutputsOrScan(
      tx, [outIndex], cdefCls, getTxFn, opts)

    return rows.reduce((result, row) => {
      if (row.outputs[outIndex] !== null) {
        result.push(row.outputs[outIndex])
      }

      return result
    }, [])
  }

  /**
   * @param {string} txId
   * @param {definitions.IColorDefinition} cdefCls
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async removeColorValues (txId, cdefCls, opts) {
    await this._storage.remove(
      {colorCode: cdefCls.getColorCode(), txId: txId}, opts)
  }
}
