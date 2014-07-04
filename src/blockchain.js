var http = require('http')
var bitcoin = require('bitcoinjs-lib')


/**
 * BlockchainState that uses [Blockchain Data API]{@link https://blockchain.info/api/blockchain_api}
 *
 * @class BlockchaininfoDataAPI
 */
function BlockchaininfoDataAPI() {}

/**
 * Make request to the server
 *
 * @param {String} path Path to resource
 * @param {Function} cb Called on response with params  (error, String)
 */
BlockchaininfoDataAPI.prototype.request = function(path, cb) {
  if (path.indexOf('cors=true') === -1)
    path += (path.indexOf('?') === -1 ? '?' : '&') + 'cors=true'

  var opts = {
    path: path,
    host: 'blockchain.info',
    port: 80
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
        response = JSON.parse(response).height
        if (response === undefined)
          throw 'height not found in response'
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
  this.request('/rawtx/' + txHash + '?format=hex', function(error, response) {
    if (error === null) {
      try {
        var tx = new Buffer(response, 'hex')
      } catch (e) {
        error = e
        response = null
      }
    }

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
  this.getRawTx(txHash, function(error, response) {
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
