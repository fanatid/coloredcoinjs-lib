var Q = require('q')
var request = require('request')

var Transaction = require('../src/index').bitcoin.Transaction


/**
 * @callback getTx~callback
 * @param {?Error} error
 * @param {Transaction} tx
 */

/**
 * @param {boolean} isTestnet
 * @param {string} txId
 * @param {getTx~callback} cb
 */
function getTx(isTestnet, txId, cb) {
  var host = isTestnet ? 'tbtc.blockr.io' : 'btc.blockr.io'
  var url = 'http://' + host + '/api/v1/tx/raw/' + txId

  Q.nfcall(request, url).spread(function (response, body) {
    if (response.statusCode !== 200) {
      throw new Error('Request error: ' + response.statusMessage)
    }

    var result = JSON.parse(body)
    if (result.status !== 'success') {
      throw new Error(result.message || 'Bad data')
    }

    return Transaction.fromHex(result.data.tx.hex)

  }).done(function (tx) { cb(null, tx) }, function (error) { cb(error) })
}

/**
 * @param {string} txId
 * @param {getTx~callback} cb
 */
function getMainnetTx(txId, cb) { getTx(false, txId, cb) }

/**
 * @param {string} txId
 * @param {getTx~callback} cb
 */
function getTestnetTx(txId, cb) { getTx(true, txId, cb) }


module.exports = {
  getMainnetTx: getMainnetTx,
  getTestnetTx: getTestnetTx
}
