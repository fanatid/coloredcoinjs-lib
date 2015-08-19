import _ from 'lodash'
import { setImmediate } from 'timers'

/**
 * @param {getTxFn} getTxFn
 * @param {(Object|bitcore.Transaction[])} transactions
 * @return {getTxFn}
 */
export function extendGetTxFn (getTxFn, transactions) {
  if (_.isArray(transactions)) {
    transactions = _.zipObject(transactions.map((tx) => {
      return [tx.id, tx.toString()]
    }))
  }

  return (txId, cb) => {
    let rawtx = transactions[txId]
    if (rawtx !== undefined) {
      setImmediate(() => { cb(null, rawtx) })
      return
    }

    getTxFn(txId, cb)
  }
}

