var transactions = require('./fixtures/transactions.json')

/**
 * @callback getTx~callback
 * @param {?Error} error
 * @param {Transaction} tx
 */

/**
 * @param {string} txid
 * @param {getTx~callback} cb
 */
function getTx (txid, cb) {
  var err = null
  var rawtx = transactions[txid]

  if (rawtx === undefined) {
    err = new Error('Transaction not found!')
  }

  cb(err, rawtx)
}

module.exports = {
  getTx: getTx
}
