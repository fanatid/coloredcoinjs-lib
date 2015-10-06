import _ from 'lodash'
import bitcore from 'bitcore'

import ColorValue from './colorvalue'
import { getArrayOfNull } from './util/js'
import { ZERO_HASH } from './util/const'

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
   * @return {Promise<Map<IColorDefinition, ColorValue[]>>}
   */
  async _getAffectingInputs (tx, outIndices, cdefCls, getTxFn, opts) {
    let inputValues = new Map()
    let ainputs = await cdefCls.getAffectingInputs(tx, outIndices, getTxFn)

    // haven't affecting inputs in tx, may be it's genesis?
    if (ainputs.length === 0) {
      let cdef = await cdefCls.fromTx(tx, this._cdmanager, opts)
      if (cdef !== null) {
        inputValues.set(cdef, getArrayOfNull(tx.inputs.length))
      }

      return inputValues
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
    await* inputss.map(async (inputs) => {
      let rawTx = await getTxFn(inputs[0].txId)
      let inputTx = bitcore.Transaction(rawTx)
      let inputOutIndices = _.pluck(inputs, 'outIndex')
      let outputValues = await this._getColorOutputsOrScan(
        inputTx, inputOutIndices, cdefCls, getTxFn, opts)

      if (outputValues.size === 0) {
        return
      }

      for (let [cdef, outputs] of outputValues.entries()) {
        if (!inputValues.has(cdef)) {
          inputValues.set(cdef, getArrayOfNull(tx.inputs.length))
        }

        let inputColorValues = inputValues.get(cdef)
        for (let input of inputs) {
          inputColorValues[input.ainput] = outputs[input.outIndex]
        }
      }
    })

    return inputValues
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
   * @return {Promise<Map<IColorDefinition, ColorValue[]>>}
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

      let colorOutputs = new Map()
      // check data for every outIndex
      for (let outIndex of outIndices) {
        // have we value for this outIndex?
        let ovalues = colorData.get(outIndex)
        if (ovalues === undefined) {
          continue
        }

        // collect all color values for this outIndex
        let cdefsMap = {}
        for (let [colorId, value] of ovalues.entries()) {
          // resolve color definition
          let cdef = cdefsMap[colorId]
          if (cdef === undefined) {
            cdef = await this._cdmanager.get({id: colorId}, {executeOpts: executeOpts})
            cdefsMap[colorId] = cdef
          }

          // create values if not exists
          if (!colorOutputs.has(cdef)) {
            colorOutputs.set(cdef, getArrayOfNull(tx.outputs.length))
          }

          // set color value
          colorOutputs.get(cdef)[outIndex] = new ColorValue(cdef, value)
        }
      }

      // update outIndices
      outIndices = _.difference(outIndices, Array.from(colorData.keys()))

      // return if have values for each input outIndex
      if (outIndices.length === 0) {
        return colorOutputs
      }

      // extract affecting inputs for each output index
      let colorInputs = await this._getAffectingInputs(
        tx, outIndices, cdefCls, getTxFn, {executeOpts: executeOpts})

      // run runKernel for each color definition
      await* Array.from(colorInputs.entries()).map(async ([cdef, inputs]) => {
        let outputs = await cdef.runKernel(tx, inputs, getTxFn)

        // saving data if need this
        if (save) {
          // save each color value
          await* outputs.map(async (cvalue, outIndex) => {
            if (cvalue === null) {
              return
            }

            await this._storage.add({
              colorCode: colorCode,
              txId: txId,
              outIndex: outIndex,
              colorId: cdef.getColorId(),
              value: cvalue.getValue()
            }, {executeOpts: executeOpts})
          })
        }

        // add found color values to colorOutputs
        if (!colorOutputs.has(cdef)) {
          if (_.any(outputs)) {
            colorOutputs.set(cdef, outputs)
          }
        } else {
          let cdefColorOutputs = colorOutputs.get(cdef)
          for (let index = 0; index < outputs.length; ++index) {
            if (outputs[index] !== null) {
              cdefColorOutputs[index] = outputs[index]
            }
          }
        }
      })

      return colorOutputs
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
   * @return {Promise<{
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
      let prevTxId = input.prevTxId.toString('hex')
      if (input.outputIndex === 0xFFFFFFFF && prevTxId === ZERO_HASH) {
        return null
      }

      let data = await this._storage.get({
        colorCode: colorCode,
        txId: prevTxId,
        outIndex: input.outputIndex
      }, {executeOpts: executeOpts})

      let value = data.get(input.outputIndex)
      if (value === undefined) {
        return null
      }

      return value
    })

    let cdefs = _.zipObject(Array.from(cOutputValues.keys()).map((cdef) => {
      return [cdef.getColorId(), cdef]
    }))

    let cInputValues = new Map()
    for (let index = 0; index < rawInputValues.length; ++index) {
      let values = rawInputValues[index]
      if (values === null) {
        continue
      }

      for (let [colorId, value] of values.entries()) {
        // resolve color definition
        let cdef = cdefs[colorId]
        if (cdef === undefined) {
          cdef = await this._cdmanager.get({id: colorId}, {executeOpts: executeOpts})
          cdefs[colorId] = cdef
        }

        // set color definition value
        if (!cInputValues.has(cdef)) {
          cInputValues.set(cdef, getArrayOfNull(tx.inputs.length))
        }

        cInputValues.get(cdef)[index] = new ColorValue(cdef, value)
      }
    }

    return {inputs: cInputValues, outputs: cOutputValues}
  }

  /**
   * @param {bitcore.Transaction} tx
   * @param {number} outIndex
   * @param {definitions.IColorDefinition} cdefCls
   * @param {getTxFn} getTxFn
   * @param {Object} [opts]
   * @param {boolean} [opts.save=true]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<ColorValue[]>}
   */
  async getOutputColorValue (tx, outIndex, cdefCls, getTxFn, opts) {
    let rows = await this._getColorOutputsOrScan(
      tx, [outIndex], cdefCls, getTxFn, opts)

    let outputColorValues = []
    for (let outputValues of rows.values()) {
      if (outputValues[outIndex] !== null) {
        outputColorValues.push(outputValues[outIndex])
      }
    }

    return outputColorValues
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
