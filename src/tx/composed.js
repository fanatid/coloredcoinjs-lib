import _ from 'lodash'

import Uncolored from '../definitions/uncolored'
import ColorValue from '../colorvalue'
import errors from '../errors'
import { varIntSize } from '../util/bitcoin'

/**
 * @class ComposedTx
 */
export default class ComposedTx {
  /**
   * @constructor
   * @param {OperationalTx} optx
   */
  constructor (optx) {
    this._optx = optx
    this._inputs = []
    this._outputs = []
  }

  /**
   * @typedef {Object} ComposedTx~Input
   * @property {string} txId
   * @property {number} outIndex
   * @property {string} [script]
   * @property {number} [sequence]
   */

  /**
   * @typedef {Object} ComposedTx~OutputTarget
   * @property {ColorTarget} target
   */

  /**
   * @typedef {Object} ComposedTx~OutputScriptValue
   * @property {string} script
   * @property {number} value
   */

  /**
   * @param {ComposedTx~Input} input
   */
  addInput (input) {
    let obj = {txId: input.txId, outIndex: input.outIndex}

    if (input.script !== undefined) {
      obj.script = input.script
    }

    if (input.sequence !== undefined) {
      obj.sequence = input.sequence
    }

    this._inputs.push(obj)
  }

  /**
   * @param {ComposedTx~Input[]} input
   */
  addInputs (inputs) {
    for (let input of inputs) {
      this.addInput(input)
    }
  }

  /**
   * @param {number} index
   * @param {number} sequence
   * @throws {RangeError}
   */
  setInputSequence (index, sequence) {
    if (index < 0 || index >= this._inputs.length) {
      throw new errors.Tx.InputNotFoundError(index)
    }

    this._inputs[index].sequence = sequence
  }

  /**
   * @return {ComposedTx~Input[]}
   */
  getInputs () {
    return _.cloneDeep(this._inputs)
  }

  /**
   * @param {(ComposedTx~OutputTarget|ComposedTx~OutputScriptValue)} output
   */
  addOutput (output) {
    let target = output.target
    if (target !== undefined) {
      if (target.isUncolored() !== true) {
        throw new errors.Tx.Composed.UncoloredOutput()
      }

      output = {script: target.getScript(), value: target.getValue()}
    }

    this._outputs.push({script: output.script, value: output.value})
  }

  /**
   * @param {Array.<(ComposedTx~OutputTarget|ComposedTx~OutputScriptValue)>} outputs
   */
  addOutputs (outputs) {
    for (let output of outputs) {
      this.addOutput(output)
    }
  }

  /**
   * @return {Array.<ComposedTx~OutScriptValue>}
   */
  getOutputs () {
    return _.cloneDeep(this._outputs)
  }

  /**
   * Estimate transaction size
   *
   * @param {Object} extra
   * @param {number} [extra.inputs=0]
   * @param {number} [extra.outputs=0]
   * @param {number} [extra.bytes=0]
   */
  estimateSize (extra) {
    extra = _.extend({
      inputs: 0,
      outputs: 0,
      bytes: 0
    }, extra)

    // 40 -- txId, output index, sequence
    // 107 -- p2pkh scriptSig length (the most common redeem script)
    let inputSize = 40 + varIntSize(107) + 107
    let inputsSize = inputSize * (this._inputs.length + extra.inputs)

    // 8 -- output value
    // 25 -- p2pkh length (the most common)
    let outputSize = 8 + varIntSize(25) + 25
    let outputsSize = this._outputs.reduce((total, output) => {
      let slen = output.script.length / 2
      return total + 8 + varIntSize(slen) + slen
    }, outputSize * extra.outputs)

    return (
      8 +
      extra.bytes +
      varIntSize(this._inputs + extra.inputs) +
      varIntSize(this._outputs + extra.outputs) +
      inputsSize +
      outputsSize
    )
  }

  /**
   * Estimate required fee for current transaction
   *
   * @param {Object} extra
   * @param {number} [extra.inputs=0]
   * @param {number} [extra.outputs=0]
   * @param {number} [extra.bytes=0]
   * @return {ColorValue}
   */
  estimateRequiredFee (extra) {
    let txSize = this.estimateSize(extra)
    let txFee = this._optx.getRequiredFee(txSize)

    // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/main.cpp#L55
    if (txFee.getValue() < 1000) {
      txFee = new ColorValue(new Uncolored(), 1000)
    }

    return txFee
  }
}
