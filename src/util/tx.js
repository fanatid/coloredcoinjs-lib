import _ from 'lodash'
import { Transaction } from 'bitcore'

/**
 * @param {getTxFn} getTxFn
 * @param {(Object|bitcore.Transaction[])} transactions
 * @return {getTxFn}
 */
export function extendGetTxFn (getTxFn, transactions) {
  if (_.isArray(transactions)) {
    transactions = _.zipObject(transactions.map((tx) => {
      return [tx.id, Transaction(tx.toObject())]
    }))
  }

  return (txId) => {
    let tx = transactions[txId]
    if (tx !== undefined) {
      tx = Transaction(tx.toObject())
      return Promise.resolve(tx)
    }

    return getTxFn(txId)
  }
}

