var _ = require('lodash')

var verify = require('./verify')


/**
 * @class ComposedTx
 * @param {OperationalTx} operationalTx
 */
function ComposedTx(operationalTx) {
  verify.OperationalTx(operationalTx)

  this.operationalTx = operationalTx
  this.txIns = []
  this.txOuts = []
}

/**
 * @param {{txId: string, outIndex: number, sequence: (number|undefined)}} txIn
 */
ComposedTx.prototype.addTxIn = function (txIn) {
  this.addTxIns([txIn])
}

/**
 * @param {{txId: string, outIndex: number, sequence: (number|undefined)}[]} txIns
 */
ComposedTx.prototype.addTxIns = function (txIns) {
  var self = this

  verify.array(txIns)
  txIns.forEach(function (txIn) {
    verify.object(txIn)
    verify.txId(txIn.txId)
    verify.number(txIn.outIndex)

    self.txIns.push({txId: txIn.txId, outIndex: txIn.outIndex})

    if (!_.isUndefined(txIn.sequence)) {
      verify.number(txIn.sequence)
      _.last(self.txIns).sequence = txIn.sequence
    }
  })
}

/**
 * @param {number} index
 * @param {number} sequence
 * @throws {RangeError} If txIn for index doesn't exists
 */
ComposedTx.prototype.setTxInSequence = function (index, sequence) {
  verify.number(index)
  verify.number(sequence)

  if (index < 0 || index >= this.txIns.length) {
    throw RangeError('index must be greate than equal or less than ' + this.txIns.length)
  }

  this.txIns[index].sequence = sequence
}

/**
 * @return {{txId: string, outIndex: number, sequence: (number|undefined)}[]}
 */
ComposedTx.prototype.getTxIns = function () {
  return this.txIns
}

/**
 * @param {({target: ColorTarget}|{script: string, value: number})} out
 * @throws {Error} If target is colored
 */
ComposedTx.prototype.addTxOut = function (out) {
  this.addTxOuts([out])
}

/**
 * @param {({target: ColorTarget}|{script: string, value: number})[]} outs
 * @throws {Error} If target is colored
 */
ComposedTx.prototype.addTxOuts = function (outs) {
  var self = this

  verify.array(outs)
  outs.forEach(function (out) {
    var txOut = {}

    if (_.isUndefined(out.target)) {
      txOut.script = out.script
      txOut.value = out.value

    } else {
      if (out.target.isUncolored() === false) {
        throw new Error('Target is colored')
      }

      txOut.script = out.target.getScript()
      txOut.value = out.target.getValue()

    }

    verify.hexString(txOut.script)
    verify.number(txOut.value)

    self.txOuts.push(txOut)
  })
}

/**
 * @return {{script: string, data: number}[]}
 */
ComposedTx.prototype.getTxOuts = function () {
  return this.txOuts
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
    txIns:  0,
    txOuts: 0,
    bytes:  0
  }, extra)

  verify.object(extra)
  verify.number(extra.txIns)
  verify.number(extra.txOuts)
  verify.number(extra.bytes)

  var size = (181 * (this.txIns.length + extra.txIns) +
              34 * (this.txOuts.length + extra.txOuts) +
              10 + extra.bytes)

  return size
}

/**
 * Estimate required fee for current transaction
 *
 * @param {Object} extra
 * @param {number} [extra.txIns=0]
 * @param {number} [extra.txOuts=1]
 * @param {number} [extra.bytes=0]
 */
ComposedTx.prototype.estimateRequiredFee = function (extra) {
  extra = _.extend({
    txIns:  0,
    txOuts: 1,
    bytes:  0
  }, extra)

  verify.object(extra)
  verify.number(extra.txIns)
  verify.number(extra.txOuts)
  verify.number(extra.bytes)

  var size = this.estimateSize(extra)
  var fee = this.operationalTx.getRequiredFee(size)

  return fee
}


module.exports = ComposedTx
