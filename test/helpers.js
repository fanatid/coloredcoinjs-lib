var _ = require('lodash')
var inherits = require('util').inherits
var bitcore = require('bitcore')

var cclib = require('../')

/**
 * @class FixedFeeOperationalTx
 * @extends OperationalTx
 * @param {number} feeSize
 */
function FixedFeeOperationalTx (feeSize) {
  cclib.tx.Operational.call(this)

  var cdef = new cclib.definitions.Uncolored()
  this._feeSize = new cclib.ColorValue(cdef, feeSize)
}

inherits(FixedFeeOperationalTx, cclib.tx.Operational)

FixedFeeOperationalTx.prototype.getRequiredFee = function () {
  return this._feeSize
}

/**
 * @param {bitcore.Transaction[]} transactions
 * @return {getTxFn}
 */
function getTxFnStub (transactions) {
  if (_.isArray(transactions)) {
    transactions = _.zipObject(transactions.map(function (tx) {
      return [tx.id, tx.toString()]
    }))
  }

  return function getTxFn (txid, cb) {
    var err = null
    var rawtx = transactions[txid]

    if (rawtx === undefined) {
      err = new Error('Transaction not found!')
    }

    cb(err, rawtx)
  }
}

/**
 * @return {string}
 */
function getRandomAddress () {
  return bitcore.PrivateKey.fromRandom(bitcore.Networks.testnet).toAddress()
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
    var itxid = bitcore.crypto.Random.getRandomBuffer(32).toString('hex')
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

  getTxFnStub: getTxFnStub,
  getTxFn: getTxFnStub(require('./fixtures/transactions.json')),

  getRandomAddress: getRandomAddress,
  createRunKernelEnv: createRunKernelEnv
}
