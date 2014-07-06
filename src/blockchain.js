var http = require('http')
var bitcoin = require('bitcoinjs-lib')


/**
 * BlockchainState that uses [Blockchain Data API]{@link https://blockchain.info/api/blockchain_api}
 *
 * @class BlockchaininfoDataAPI
 */
function BlockchaininfoDataAPI() {
  this.host = 'blockchain.info'
  this.port = 80
}

/**
 * Make request to the server
 *
 * @param {String} path Path to resource
 * @param {Function} cb Called on response with params  (error, String)
 */
BlockchaininfoDataAPI.prototype.request = function(path, cb) {
  if (path.indexOf('cors=') === -1)
    path += (path.indexOf('?') === -1 ? '?' : '&') + 'cors=true'

  var opts = {
    path: path,
    host: this.host,
    port: this.port
  }

  http.get(opts, function(res) {
    var buf = ''

    res.on('data', function(data) {
      buf += data
    })

    res.on('end', function() {
      cb(null, buf)
    })

    res.on('error', function(error) {
      cb(error, null)
    })
  })
}

/**
 * Get block count in blockchain
 *
 * @param {Function} cb Called on response with params  (error, Number)
 */
BlockchaininfoDataAPI.prototype.getBlockCount = function(cb) {
  this.request('/latestblock', function(error, response) {
    if (error === null) {
      try {
        response = parseInt(JSON.parse(response).height)
        if (isNaN(response))
          throw 'heght not number'
      } catch (e) {
        error = e
        response = null
      }
    }

    cb(error, response)
  })
}

/**
 * Get raw transaction by txHash
 *
 * @param {String} txHash Transaction hash in hex
 * @param {Function} cb Called on response with params  (error, String)
 */
BlockchaininfoDataAPI.prototype.getRawTx = function(txHash, cb) {
  this.getTx(txHash, function(error, response) {
    if (error === null)
      response = response.toHex()

    cb(error, response)
  })
}

/**
 * Get transaction by txHash
 *
 * @param {String} txHash Transaction hash in hex
 * @param {Function} cb Called on response with params (error, bitcoinjs-lib.Transaction)
 */
BlockchaininfoDataAPI.prototype.getTx = function(txHash, cb) {
  this.request('/rawtx/' + txHash + '?format=hex', function(error, response) {
    if (error === null) {
      try {
        response = bitcoin.Transaction.fromHex(response)
      } catch (e) {
        error = e
        response = null
      }
    }

    cb(error, response)
  })
}


module.exports = {
  BlockchaininfoDataAPI: BlockchaininfoDataAPI
}
