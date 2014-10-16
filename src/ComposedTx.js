var assert = require('assert')

var _ = require('lodash')

var OperationalTx = require('./OperationalTx')


/**
 * @class ComposedTx
 *
 * @param {OperationalTx} operationalTx
 */
function ComposedTx(operationalTx) {
  assert(operationalTx instanceof OperationalTx,
    'Expected operationalTx instance of OperationalTx, got ' + operationalTx)

  this.operationalTx = operationalTx
  this.txIns = []
  this.txOuts = []
}

// Todo: change coin to object
/**
 * @param {Coin} txIn
 */
ComposedTx.prototype.addTxIn = function(txIn) {
  this.txIns.push(txIn)
}

/**
 * @param {Coin[]} txIns
 */
ComposedTx.prototype.addTxIns = function(txIns) {
  txIns.forEach(this.addTxIn.bind(this))
}

/**
 * @return {Coin[]}
 */
ComposedTx.prototype.getTxIns = function() {
  return this.txIns
}

/**
 * @param {Object} data
 * @param {ColorTarget} [data.target] If data.target is not undefined, script and value will be extracted from target
 * @param {Buffer} [data.script]
 * @param {number} [data.value]
 * @throws {Error} If target is colored
 */
ComposedTx.prototype.addTxOut = function(data) {
  if (!_.isUndefined(data.target)) {
    if (!data.target.isUncolored())
      throw new Error('target is colored')

    data.script = data.target.getScript()
    data.value = data.target.getValue()
  }

  this.txOuts.push({ script: data.script, value: data.value })
}

/**
 * @param {ColorTarget[]} colorTargets
 */
ComposedTx.prototype.addTxOuts = function(colorTargets) {
  colorTargets.forEach(this.addTxOut.bind(this))
}

/**
 * @return {ColorTarget[]}
 */
ComposedTx.prototype.getTxOuts = function() {
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
ComposedTx.prototype.estimateSize = function(extra) {
  extra = _.extend({
    txIns:  0,
    txOuts: 0,
    bytes:  0
  }, extra)

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
ComposedTx.prototype.estimateRequiredFee = function(extra) {
  extra = _.extend({
    txIns:  0,
    txOuts: 1,
    bytes:  0
  }, extra)

  var size = this.estimateSize(extra)
  var fee = this.operationalTx.getRequiredFee(size)

  return fee
}


module.exports = ComposedTx
