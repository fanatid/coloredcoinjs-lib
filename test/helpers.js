import _ from 'lodash'
import crypto from 'crypto'
import bitcore from 'bitcore'

import cclib from '../src'

/**
 * @class FixedFeeOperationalTx
 * @extends OperationalTx
 */
class FixedFeeOperationalTx extends cclib.tx.Operational {
  /**
   * @constructor
   * @param {number} feeSize
   */
  constructor (feeSize) {
    super()

    let cdef = cclib.definitions.Manager.getUncolored()
    this._feeSize = new cclib.ColorValue(cdef, feeSize)
  }

  /**
   * @return {ColorValue}
   */
  getRequiredFee () {
    return this._feeSize
  }
}

/**
 * @param {bitcore.Transaction} tx
 * @param {string|Buffer} hash
 * @param {number} outIndex
 * @param {number} sequence
 * @param {string} [address]
 * @return {bitcore.Transaction}
 */
function addInput (tx, hash, outIndex, sequence, address) {
  if (_.isString(hash)) {
    hash = new Buffer(hash, 'hex')
  }
  address = address || getRandomAddress()

  return tx.uncheckedAddInput(bitcore.Transaction.Input({
    prevTxId: new Buffer(hash),
    outputIndex: outIndex,
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
  if (_.isArray(transactions)) {
    transactions = _.zipObject(transactions.map((tx) => {
      if (!(tx instanceof bitcore.Transaction)) {
        tx = bitcore.Transaction(tx)
      }

      return [tx.id, tx]
    }))
  }

  return (txId) => {
    let tx = transactions[txId]
    if (tx !== undefined) {
      return Promise.resolve(tx)
    }

    return Promise.reject(new Error(`${txId} not found`))
  }
}

/**
 * @return {string}
 */
function getRandomAddress () {
  return bitcore.PrivateKey.fromRandom('testnet').toAddress()
}

/**
 * @param {string} txId
 * @param {number[]} inputs
 * @param {number[]} outputs
 * @param {(number|number[])} sequence
 * @return {{top: bitcore.Transaction, deps: bitcore.Transaction[]}}
 */
function createRunKernelEnv (txId, inputs, outputs, sequence) {
  let top = bitcore.Transaction()
  let deps = []

  let txHash = Array.prototype.reverse.call(new Buffer(txId, 'hex'))
  top._getHash = () => { return txHash }

  for (let satoshis of inputs) {
    let inTxId = crypto.pseudoRandomBytes(32).toString('hex')
    top.uncheckedAddInput(bitcore.Transaction.Input({
      prevTxId: inTxId,
      outputIndex: 0,
      script: bitcore.Script.fromAddress(getRandomAddress())
    }))

    let env = createRunKernelEnv(inTxId, [], [satoshis], [0, 1, 4, 5, 6, 7])
    deps = deps.concat(env.top, env.deps)
  }

  if (top.inputs.length === 0) {
    top.uncheckedAddInput(bitcore.Transaction.Input({
      prevTxId: new Buffer(32),
      outputIndex: 0,
      sequenceNumber: 4294967295,
      script: bitcore.Script.fromAddress(getRandomAddress())
    }))
  }

  if (_.isArray(sequence)) {
    sequence = sequence.reduce((total, i) => {
      return total + Math.pow(2, i)
    }, 0)
  }

  top.inputs[0].sequenceNumber = sequence

  for (let satoshis of outputs) {
    top.addOutput(bitcore.Transaction.Output({
      satoshis: satoshis,
      script: bitcore.Script.buildPublicKeyHashOut(getRandomAddress())
    }))
  }

  return {top: top, deps: deps}
}

export default {
  FixedFeeOperationalTx: FixedFeeOperationalTx,
  tx: {
    addInput: addInput,
    addOutput: addOutput
  },
  getTxFnStub: getTxFnStub,
  getTxFn: getTxFnStub(require('./fixtures/transactions.json')),
  getRandomAddress: getRandomAddress,
  createRunKernelEnv: createRunKernelEnv
}
