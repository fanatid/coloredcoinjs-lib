import initReadyMixin from 'ready-mixin'
import { Transaction } from 'bitcore'
import { promisify } from 'promise-useful-utils'

import { ZERO_HASH } from '../util/const'

/**
 * @callback getTxFn~callback
 * @param {Error} err
 * @param {string} rawTx
 */

/**
 * @callback getTxFn
 * @param {string} txId
 * @param {getTxFn~callback} callback
 */

/**
 * @class FilledInputsTx
 * @mixes ReadyMixin
 */
export default class FilledInputsTx {
  /**
   * @constructor
   * @param {string} rawtx
   * @param {getTxFn} getTxFn
   */
  constructor (rawtx, getTxFn) {
    Promise.resolve()
      .then(async () => {
        this._tx = new Transaction(rawtx)
        this._prevTxs = []
        this._prevValues = []

        let getTx = promisify(getTxFn)
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

          let rawtx = await getTx(inputTxId)
          let tx = new Transaction(rawtx)
          this._prevTxs[index] = tx
          this._prevValues[index] = tx.outputs[input.outputIndex].satoshis
        })
      })
      .then(() => { this._ready() }, (err) => { this._ready(err) })
  }

  /**
   * @return {bitcore.Transaction}
   */
  getTx () {
    return Transaction.shallowCopy(this._tx)
  }

  /**
   * @param {number} index
   * @return {Promise.<?bitcore.Transaction>}
   */
  async getInputTx (index) {
    await this.ready

    let tx = this._prevTxs[index]
    if (tx !== null) {
      tx = Transaction.shallowCopy(tx)
    }

    return tx
  }

  /**
   * @param {number} index
   * @return {Promise.<number>}
   */
  async getInputValue (index) {
    await this.ready
    return this._prevValues[index]
  }
}

let ReadyMixin = initReadyMixin(Promise)
ReadyMixin(FilledInputsTx.prototype)
