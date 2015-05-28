var _ = require('lodash')
var setImmediate = require('timers').setImmediate

/**
 * @param {getTxFn} getTxFn
 * @param {(Object|bitcore.Transaction[])} transactions
 * @return {getTxFn}
 */
module.exports.extendGetTxFn = function (getTxFn, transactions) {
  if (_.isArray(transactions)) {
    transactions = _.zipObject(transactions.map(function (tx) {
      return [tx.id, tx.toString()]
    }))
  }

  return function (txid, cb) {
    var rawtx = transactions[txid]
    if (rawtx !== undefined) {
      setImmediate(function () { cb(null, rawtx) })
      return
    }

    getTxFn(txid, cb)
  }
}

