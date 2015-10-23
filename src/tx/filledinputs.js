import { mixin } from 'core-decorators'
import ReadyMixin from 'ready-mixin'
import { Transaction } from 'bitcore-lib'

import { ZERO_HASH } from '../util/const'

/**
 * @callback getTxFn
 * @param {string} txId
 * @return {Promise<(string|bitcore.Transaction|Buffer|Object)>}
 */

/**
 * @class FilledInputsTx
 * @mixes ReadyMixin
 */
@mixin(ReadyMixin)
export default class FilledInputsTx {
  /**
   * @constructor
   * @param {string} rawTx
   * @param {getTxFn} getTxFn
   */
  constructor (rawTx, getTxFn) {
    Promise.resolve()
      .then(async () => {
        this._tx = new Transaction(rawTx)
        this._prevTxs = []
        this._prevValues = []

        await* this._tx.inputs.map(async (input, index) => {
          let inputTxId = input.prevTxId.toString('hex')

          let isCoinbase = index === 0 &&
                           input.outputIndex === 4294967295 &&
                           inputTxId === ZERO_HASH
          if (isCoinbase) {
            this._prevTxs[index] = null
            this._prevValues[index] = 0
            return
          }

          let rawTx = await getTxFn(inputTxId)
          let tx = new Transaction(rawTx)
          this._prevTxs[index] = tx
          this._prevValues[index] = tx.outputs[input.outputIndex].satoshis
        })
      })
      .then(() => this._ready(null), (err) => this._ready(err))
  }

  /**
   * @return {bitcore.Transaction}
   */
  getTx () {
    return Transaction(this._tx.toObject())
  }

  /**
   * @param {number} index
   * @return {Promise<?bitcore.Transaction>}
   */
  async getInputTx (index) {
    await this.ready

    let tx = this._prevTxs[index] || null
    if (tx !== null) {
      tx = Transaction(tx.toObject())
    }

    return tx
  }

  /**
   * @param {number} index
   * @return {Promise<?number>}
   */
  async getInputValue (index) {
    await this.ready

    let value = this._prevValues[index]
    if (value === undefined) {
      value = null
    }

    return value
  }
}
