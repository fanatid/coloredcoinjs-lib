var _ = require('lodash')

var verify = require('../src/index').verify


/**
 * Stub for blockchain.BlockchainStateBase.getTx
 *
 * @param {bitcoinjs-lib.Transaction[]} transactions
 * @return {function}
 */
function getTxStub(transactions) {
  verify.array(transactions)
  transactions.forEach(verify.Transaction)

  var txMap = {}

  transactions.forEach(function(tx) {
    txMap[tx.getId()] = tx.clone()
  })

  function getTx(txId, cb) {
    if (_.isUndefined(txMap[txId]))
      cb(new Error('notFoundTx'))
    else
      cb(null, txMap[txId].clone())
  }

  return getTx
}


module.exports = {
  getTxStub: getTxStub
}
