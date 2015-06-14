'use strict'

var _ = require('lodash')

var Uncolored = require('../definitions/uncolored')
var ColorValue = require('../colorvalue')
var errors = require('../errors')

function varIntSize (i) {
  return i < 253 ? 1
  : i < 0x10000 ? 3
  : i < 0x100000000 ? 5
  : 9
}

/**
 * @class ComposedTx
 * @param {OperationalTx} optx
 */
function ComposedTx (optx) {
  this._optx = optx
  this._inputs = []
  this._outputs = []
}

/**
 * @typedef {Object} ComposedTx~Input
 * @property {string} txid
 * @property {number} oidx
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
ComposedTx.prototype.addInput = function (input) {
  this.addInputs([input])
}

/**
 * @param {ComposedTx~Input[]} input
 */
ComposedTx.prototype.addInputs = function (inputs) {
  var self = this

  inputs.forEach(function (input) {
    self._inputs.push({txid: input.txid, oidx: input.oidx})

    if (input.script !== undefined) {
      _.last(self._inputs).script = input.script
    }

    if (input.sequence !== undefined) {
      _.last(self._inputs).sequence = input.sequence
    }
  })
}

/**
 * @param {number} index
 * @param {number} sequence
 * @throws {RangeError}
 */
ComposedTx.prototype.setInputSequence = function (index, sequence) {
  if (index < 0 || index >= this._inputs.length) {
    throw new errors.Tx.InputNotFoundError(index)
  }

  this._inputs[index].sequence = sequence
}

/**
 * @return {ComposedTx~Input[]}
 */
ComposedTx.prototype.getInputs = function () {
  return _.cloneDeep(this._inputs)
}

/**
 * @param {(ComposedTx~OutputTarget|ComposedTx~OutputScriptValue)} output
 */
ComposedTx.prototype.addOutput = function (output) {
  this.addOutputs([output])
}

/**
 * @param {Array.<(ComposedTx~OutputTarget|ComposedTx~OutputScriptValue)>} outputs
 */
ComposedTx.prototype.addOutputs = function (outputs) {
  var self = this

  outputs.forEach(function (output) {
    var target = output.target
    if (target !== undefined) {
      if (target.isUncolored() !== true) {
        throw new errors.Tx.Composed.UncoloredOutput()
      }

      output = {script: target.getScript(), value: target.getValue()}
    }

    var data = {script: output.script, value: output.value}
    return self._outputs.push(data)
  })
}

/**
 * @return {Array.<ComposedTx~OutScriptValue>}
 */
ComposedTx.prototype.getOutputs = function () {
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
ComposedTx.prototype.estimateSize = function (extra) {
  extra = _.extend({
    inputs: 0,
    outputs: 0,
    bytes: 0
  }, extra)

  // 40 -- txid, output index, sequence
  // 107 -- p2pkh scriptSig length (the most common redeem script)
  var inputSize = 40 + varIntSize(107) + 107
  var inputsSize = inputSize * (this._inputs.length + extra.inputs)

  // 8 -- output value
  // 25 -- p2pkh length (the most common)
  var outputSize = 8 + varIntSize(25) + 25
  var outputsSize = this._outputs.reduce(function (total, output) {
    var slen = output.script.length / 2
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
ComposedTx.prototype.estimateRequiredFee = function (extra) {
  var txSize = this.estimateSize(extra)
  var txFee = this._optx.getRequiredFee(txSize)

  // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/main.cpp#L55
  if (txFee.getValue() < 1000) {
    txFee = new ColorValue(new Uncolored(), 1000)
  }

  return txFee
}

module.exports = ComposedTx
