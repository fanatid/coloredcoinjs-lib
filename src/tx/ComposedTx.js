var assert = require('assert')

var _ = require('lodash')

var ColorValue = require('../color/ColorValue')
var ColorTarget = require('../color/ColorTarget')
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
  // Todo: not sure
  // txIns -- array of coins? how get privkey for sign?
  this.txIns = []
  this.txOuts = []
}

/**
 * @param {} txIn
 */
ComposedTx.prototype.addTxIn = function(txIn) {
  this.txIns.push(txIn)
}

/**
 * @param {Array} txIns
 */
ComposedTx.prototype.addTxIns = function(txIns) {
  assert(_.isArray(txIns), 'Expected Array txIns, got ' + txIns)

  var self = this

  txIns.forEach(function(txIn) {
    self.addTxIn(txIn)
  })
}

/**
 * @param {Object} data
 * @param {ColorTarget} [data.target]
 * @param {string} [data.targetAddr]
 * @param {number} [data.value]
 * @param {boolean} [data.isFeeChange=false]
 * @param {function} cb
 */
ComposedTx.prototype.addTxOut = function(data, cb) {
  // get data in type-checks
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (_.isUndefined(data.value) && !_.isUndefined(data.target) && data.target.isUncolored())
    data.value = data.target.getValue()
  if (data.value instanceof ColorValue && data.value.isUncolored())
    data.value = data.value.getValue()
  assert(_.isNumber(data.value), 'Expected number data.value, got ' + data.value)

  if (_.isUndefined(data.targetAddr) && !_.isUndefined(data.target))
    data.targetAddr = data.target.getAddress()
  assert(_.isString(data.targetAddr), 'Expected string data.targetAddr, got ' + data.targetAddr)

  if (_.isUndefined(data.isFeeChange)) data.isFeeChange = false
  assert(_.isBoolean(data.isFeeChange), 'Expected boolean data.isFeeChange, got ' + data.isFeeChange)

  this.txOuts.push({
    targetAddr: data.targetAddr,
    value: data.value,
    isFeeChange: data.isFeeChange
  })

  process.nextTick(function() { cb(null) })
}

/**
 * @param {Array} txOuts Array of ColorTarget
 * @param {function} cb
 */
ComposedTx.prototype.addTxOuts = function(txOuts, cb) {
  assert(_.isArray(txOuts), 'Expected Array txOuts, got ' + txOuts)
  txOuts.forEach(function(txOut) {
    assert(txOut instanceof ColorTarget, 'Expected Array of ColorTarget, got ' + txOuts)
  })

  var self = this

  txOuts = txOuts.map(function(txOut) {
    return { address: txOut.getAddress, value: txOut.getValue() }
  })

  function add(index) {
    if (index == txOuts.length) {
      cb(null)
      return
    }

    self.addTxOut(txOuts[index], function(error) {
      if (error === null)
        add(index+1)
      else
        cb(error)
    })
  }

  add(0)
}

/**
 * Estimate transaction size
 *
 * @param {Object} data
 * @param {number} [data.extraTxIns=0]
 * @param {number} [data.extraTxOuts=0]
 * @param {number} [data.extraBytes=0]
 */
ComposedTx.prototype.estimateSize = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  if (_.isUndefined(data.extraTxIns)) data.extraTxIns = 0
  assert(_.isNumber(data.extraTxIns), 'Expected number data.extraTxIns, got ' + data.extraTxIns)
  if (_.isUndefined(data.extraTxOuts)) data.extraTxOuts = 0
  assert(_.isNumber(data.extraTxOuts), 'Expected number data.extraTxOuts, got ' + data.extraTxOuts)
  if (_.isUndefined(data.extraBytes)) data.extraBytes = 0
  assert(_.isNumber(data.extraBytes), 'Expected number data.extraBytes, got ' + data.extraBytes)

/*
return (181 * (len(self.txins) + extra_txins) + 
                34 * (len(self.txouts) + extra_txouts) + 
                10 + extra_bytes)
*/
  var size = 0

  return size
}

/**
 * Estimate required fee for current transaction
 *
 * @param {Object} data
 * @param {number} [data.extraTxIns=0]
 * @param {number} [data.extraTxOuts=1]
 * @param {number} [data.extraBytes=0]
 */
ComposedTx.prototype.estimateRequiredFee = function(data) {
  if (_.isUndefined(data.extraTxOuts)) data.extraTxOuts = 1

  var txSize = this.estimateSize(data)

  return this.operationalTx.getRequiredFee(txSize)
}


module.exports = ComposedTx
