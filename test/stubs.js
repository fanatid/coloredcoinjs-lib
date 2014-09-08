var assert = require('assert')
var _ = require('lodash')

var coloredcoinlib = require('../src/index')
var Transaction = coloredcoinlib.Transaction


/**
 * Stub for blockchain.BlockchainStateBase.getTx
 *
 * @param {Array} transactions Array of transaction.Transaction
 * @return {function}
 */
function getTxStub(transactions) {
  assert(_.isArray(transactions), 'Expected transactions Array, got ' + transactions)
  assert(transactions.every(function(tx) { return (tx instanceof Transaction) }),
    'Expected transactions Array of transaction.Transaction, got ' + transactions)

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
