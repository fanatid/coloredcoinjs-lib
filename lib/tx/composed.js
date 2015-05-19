var _ = require('lodash')

var varIntSize = require('../bitcoin').bufferutils.varIntSize
var getUncolored = require('../definitions/manager').getUncolored
var ColorValue = require('../colorvalue')

/**
 * @class ComposedTx
 * @param {OperationalTx} operationalTx
 */
function ComposedTx (operationalTx) {
  this.operationalTx = operationalTx
  this.txIns = []
  this.txOuts = []
}

/**
 * @typedef {Object} ComposedTx~Input
 * @property {string} txId
 * @property {number} outIndex
 * @property {number} [sequence]
 */

/**
 * @typedef {Object} ComposedTx~OutTarget
 * @property {ColorTarget} target
 */

/**
 * @typedef {Object} ComposedTx~OutScriptValue
 * @property {string} script
 * @property {number} value
 */

/**
 * @param {ComposedTx~Input} txIn
 */
ComposedTx.prototype.addTxIn = function (txIn) {
  this.addTxIns([txIn])
}

/**
 * @param {ComposedTx~Input[]} txIns
 */
ComposedTx.prototype.addTxIns = function (txIns) {
  var self = this

  txIns.forEach(function (txIn) {
    self.txIns.push({txId: txIn.txId, outIndex: txIn.outIndex})

    if (!_.isUndefined(txIn.sequence)) {
      _.last(self.txIns).sequence = txIn.sequence
    }
  })
}

/**
 * @param {number} index
 * @param {number} sequence
 * @throws {RangeError}
 */
ComposedTx.prototype.setTxInSequence = function (index, sequence) {
  if (index < 0 || index >= this.txIns.length) {
    throw new RangeError('TxIn for index not found')
  }

  this.txIns[index].sequence = sequence
}

/**
 * @return {ComposedTx~Input[]}
 */
ComposedTx.prototype.getTxIns = function () {
  return _.cloneDeep(this.txIns)
}

/**
 * @param {(ComposedTx~OutTarget|ComposedTx~OutScriptValue)} out
 */
ComposedTx.prototype.addTxOut = function (out) {
  this.addTxOuts([out])
}

/**
 * @param {Array.<(ComposedTx~OutTarget|ComposedTx~OutScriptValue)>} outs
 */
ComposedTx.prototype.addTxOuts = function (outs) {
  var self = this

  outs.forEach(function (out) {
    var txOut = {}

    if (_.isUndefined(out.target)) {
      txOut.script = out.script
      txOut.value = out.value

    } else {
      if (out.target.isUncolored() === false) {
        throw new TypeError('target must be colored')
      }

      txOut.script = out.target.getScript()
      txOut.value = out.target.getValue()

    }

    self.txOuts.push(txOut)
  })
}

/**
 * @return {Array.<ComposedTx~OutScriptValue>}
 */
ComposedTx.prototype.getTxOuts = function () {
  return _.cloneDeep(this.txOuts)
}

/**
 * Estimate transaction size
 *
 * @param {Object} extra
 * @param {number} [extra.txIns=0]
 * @param {number} [extra.txOuts=0]
 * @param {number} [extra.bytes=0]
 */
ComposedTx.prototype.estimateSize = function (extra) {
  extra = _.extend({
    txIns: 0,
    txOuts: 0,
    bytes: 0
  }, extra)

  // 40 -- txId, outIndex, sequence
  // 107 -- P2PKH scriptSig length (the most common redeem script)
  var txInSize = (40 + varIntSize(107) + 107) * (this.txIns.length + extra.txIns)

  // 8 -- output value
  // 25 -- P2PKH length (the most common)
  var txOutSize = this.txOuts.reduce(function (a, x) {
    return a + (8 + varIntSize(x.script.length / 2) + x.script.length / 2)

  }, (8 + varIntSize(25) + 25) * extra.txOuts)

  return (
    8 +
    extra.bytes +
    varIntSize(this.txIns + extra.txIns) +
    varIntSize(this.txOuts + extra.txOuts) +
    txInSize +
    txOutSize
  )
}

/**
 * Estimate required fee for current transaction
 *
 * @param {Object} extra
 * @param {number} [extra.txIns=0]
 * @param {number} [extra.txOuts=1]
 * @param {number} [extra.bytes=0]
 * @return {ColorValue}
 */
ComposedTx.prototype.estimateRequiredFee = function (extra) {
  var txSize = this.estimateSize(extra)
  var txFee = this.operationalTx.getRequiredFee(txSize)

  // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/main.cpp#L55
  // int64_t CTransaction::nMinRelayTxFee = 1000;
  if (txFee.getValue() < 1000) {
    txFee = new ColorValue(getUncolored(), 1000)
  }

  return txFee
}

module.exports = ComposedTx
