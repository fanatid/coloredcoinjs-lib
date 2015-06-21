'use strict'

var _ = require('lodash')
var timers = require('timers')
var inherits = require('util').inherits
var crypto = require('crypto')
var bitcore = require('bitcore')

var cclib = require('../')

/**
 * @class FixedFeeOperationalTx
 * @extends OperationalTx
 * @param {number} feeSize
 */
function FixedFeeOperationalTx (feeSize) {
  cclib.tx.OperationalTx.call(this)

  var cdef = new cclib.definitions.Uncolored()
  this._feeSize = new cclib.ColorValue(cdef, feeSize)
}

inherits(FixedFeeOperationalTx, cclib.tx.OperationalTx)

FixedFeeOperationalTx.prototype.getRequiredFee = function () {
  return this._feeSize
}

/**
 * @param {bitcore.Transaction} tx
 * @param {string|Buffer} hash
 * @param {number} oidx
 * @param {number} sequence
 * @param {string} [address]
 * @return {bitcore.Transaction}
 */
function addInput (tx, hash, oidx, sequence, address) {
  if (_.isString(hash)) {
    hash = new Buffer(hash, 'hex')
  }
  address = address || getRandomAddress()

  return tx.uncheckedAddInput(bitcore.Transaction.Input({
    prevTxId: new Buffer(hash),
    outputIndex: oidx,
    sequenceNumber: sequence,
    script: bitcore.Script.fromAddress(address)
  }))
}

/**
 * @param {bitcore.Transaction} tx
 * @param {number} value
 * @param {string} [address]
 * @return {bitcore.Transaction}
 */
function addOutput (tx, value, address) {
  address = address || getRandomAddress()

  return tx.addOutput(bitcore.Transaction.Output({
    satoshis: value,
    script: bitcore.Script.buildPublicKeyHashOut(address)
  }))
}

/**
 * @param {bitcore.Transaction[]} transactions
 * @return {getTxFn}
 */
function getTxFnStub (transactions) {
  return cclib.util.tx.extendGetTxFn(function (txid, cb) {
    timers.setImmediate(function () {
      cb(new Error(txid + ' not found'))
    })
  }, transactions)
}

/**
 * @return {string}
 */
function getRandomAddress () {
  return bitcore.PrivateKey.fromRandom('testnet').toAddress()
}

/**
 * @param {string} txid
 * @param {number[]} inputs
 * @param {number[]} outputs
 * @param {(number|number[])} sequence
 * @return {{top: bitcore.Transaction, deps: bitcore.Transaction[]}}
 */
function createRunKernelEnv (txid, inputs, outputs, sequence) {
  var top = bitcore.Transaction()
  var deps = []

  var txHash = Array.prototype.reverse.call(new Buffer(txid, 'hex'))
  top._getHash = function () { return txHash }

  inputs.forEach(function (satoshis) {
    var itxid = crypto.pseudoRandomBytes(32).toString('hex')
    top.uncheckedAddInput(bitcore.Transaction.Input({
      prevTxId: itxid,
      outputIndex: 0,
      script: bitcore.Script.fromAddress(getRandomAddress())
    }))

    var env = createRunKernelEnv(itxid, [], [satoshis], [0, 1, 4, 5, 6, 7])
    deps = deps.concat(env.top, env.deps)
  })

  if (top.inputs.length === 0) {
    top.uncheckedAddInput(bitcore.Transaction.Input({
      prevTxId: new Buffer(32),
      outputIndex: 0,
      sequenceNumber: 4294967295,
      script: bitcore.Script.fromAddress(getRandomAddress())
    }))
  }

  if (_.isArray(sequence)) {
    sequence = sequence.reduce(function (total, i) {
      return total + Math.pow(2, i)
    }, 0)
  }

  top.inputs[0].sequenceNumber = sequence

  outputs.forEach(function (satoshis) {
    top.addOutput(bitcore.Transaction.Output({
      satoshis: satoshis,
      script: bitcore.Script.buildPublicKeyHashOut(getRandomAddress())
    }))
  })

  return {top: top, deps: deps}
}

module.exports = {
  FixedFeeOperationalTx: FixedFeeOperationalTx,
  tx: {
    addInput: addInput,
    addOutput: addOutput
  },

  getTxFnStub: getTxFnStub,
  getTxFn: getTxFnStub(require('./fixtures/transactions')),

  getRandomAddress: getRandomAddress,
  createRunKernelEnv: createRunKernelEnv
}
