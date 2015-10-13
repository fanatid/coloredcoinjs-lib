import _ from 'lodash'

import Uncolored from '../definitions/uncolored'
import ColorValue from '../colorvalue'
import { NotImplemented } from '../errors'

/**
 * @class OperationalTx
 */
export default class OperationalTx {
  /**
   * @constructor
   */
  constructor () {
    this._targets = []
  }

  /**
   * @param {ColorTarget} ctarget
   */
  addTarget (target) {
    this._targets.push(target)
  }

  /**
   * @param {ColorTarget[]} targets
   */
  addTargets (targets) {
    for (let target of targets) {
      this.addTarget(target)
    }
  }

  /**
   * @return {ColorTarget[]}
   */
  getTargets () {
    return this._targets
  }

  /**
   * @return {boolean}
   */
  isMonoColor () {
    let cids = _.invoke(this._targets, 'getColorId')
    return _.uniq(cids).length <= 1
  }

  /**
   * @callback OperationalTx~FeeEstimatorEstimateRequiredFee
   * @param {Object} extra
   * @param {number} [extra.inputs]
   * @param {number} [extra.outputs]
   * @param {number} [extra.bytes]
   * @return {number}
   */

  /**
   * @typedef {Object} OperationalTx~FeeEstimator
   * @property {OperationalTx~FeeEstimatorEstimateRequiredFee} estimateRequiredFee
   */

  /**
   * @typedef {Object} OperationalTx~AbstractRawCoin
   * @property {string} txId
   * @property {number} outIndex
   * @property {number} value
   * @property {string} script
   */

  /**
   * @callback OperationalTx~AbstractCoinToRawCoin
   * @return {OperationalTx~AbstractRawCoin}
   */

  /**
   * @typedef {Object} OperationalTx~AbstractCoin
   * @property {OperationalTx~AbstractCoinToRawCoin} toRawCoin
   */

  /**
   * @typedef OperationalTx~selectCoinsResult
   * @property {OperationalTx~AbstractCoin[]} coins
   * @property {ColorValue} total
   */

  /**
   * Return of object that have
   *  coins -- an array of utxo objects with same color that given color value
   *  total -- sum of coins that at least equal of given color value
   * For uncolored coins sum of values of UTXO objects must also include
   *  a fee (usually it is ComposedTx)
   *
   * @abstract
   * @param {ColorValue} cvalue
   * @param {OperationalTx~FeeEstimator} [feeEstimator]
   * @return {Promise<OperationalTx~selectCoinsResult>}
   */
  async selectCoins () {
    throw new NotImplemented(this.constructor.name + '.selectCoins')
  }

  /**
   * Returns an address which can be used as a change for given color definition
   *
   * @abstract
   * @param {IColorDefinition} cdef
   * @return {Promise<string>}
   */
  async getChangeAddress () {
    throw new NotImplemented(this.constructor.name + '.getChangeAddress')
  }

  /**
   * Returns ColorValue representing the fee for a certain tx size
   *
   * @param {number} txSize Transaction size in bytes
   * @param {number} [feePerKb=10000] Satoshis-per-kilobyte
   * @return {ColorValue}
   */
  getRequiredFee (txSize, feePerKb) {
    // https://github.com/bitcoin/bitcoin/blob/v0.9.2/src/main.cpp#L53
    if (feePerKb === undefined) {
      feePerKb = 10000
    }

    let uncolored = new Uncolored()
    let feeValue = Math.ceil(txSize * feePerKb / 1000)

    return new ColorValue(uncolored, feeValue)
  }

  /**
   * Returns ColorValue representing smallest satoshi value
   *  which isn't dust according to current parameters
   *
   * @param {number} [minRelayTxFee=5000] Satoshis-per-kilobyte
   * @return {ColorValue}
   */
  getDustThreshold (minRelayTxFee) {
    // https://github.com/bitcoin/bitcoin/pull/6793
    if (minRelayTxFee === undefined) {
      minRelayTxFee = 5000
    }

    let uncolored = new Uncolored()
    return new ColorValue(uncolored, Math.ceil(182 * 3 * minRelayTxFee / 1000))
  }

  /**
   * @return {ComposedTx}
   */
  makeComposedTx () {
    let ComposedTx = require('./composed')
    return new ComposedTx(this)
  }
}
