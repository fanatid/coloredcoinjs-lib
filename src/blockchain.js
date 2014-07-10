var assert = require('assert')
var _ = require('underscore')
var inherits = require('inherits')
var http = require('http')
var bitcoin = require('bitcoinjs-lib')


/**
 * @class BlockchainStateBase
 */
function BlockchainStateBase() {}


/**
 * BlockchainState that uses [Blockchain Data API]{@link https://blockchain.info/api/blockchain_api}
 *
 * @class BlockchaininfoDataAPI
 */
function BlockchaininfoDataAPI(host, port) {
  host = host === undefined ? 'blockchain.info' : host
  port = port === undefined ? 80 : port

  assert(_.isString(host), 'Expected string host, got ' + host)
  assert(_.isNumber(port), 'Expected number port, got ' + port)

  BlockchainStateBase.call(this)

  this.host = host
  this.port = port
}

inherits(BlockchaininfoDataAPI, BlockchainStateBase)

/**
 * Make request to the server
 *
 * @param {string} path Path to resource
 * @param {function} cb Called on response with params  (error, string)
 */
BlockchaininfoDataAPI.prototype.request = function(path, cb) {
  assert(_.isString(path), 'Expected string path, got ' + path)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

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
 * @param {function} cb Called on response with params  (error, number)
 */
BlockchaininfoDataAPI.prototype.getBlockCount = function(cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

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
 * @param {string} txHash Transaction hash in hex
 * @param {function} cb Called on response with params  (error, string)
 */
BlockchaininfoDataAPI.prototype.getRawTx = function(txHash, cb) {
  assert(_.isString(txHash), 'Expected string txHash, got ' + txHash)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.getTx(txHash, function(error, response) {
    if (error === null)
      response = response.toHex()

    cb(error, response)
  })
}

/**
 * Get transaction by txHash
 *
 * @param {string} txHash Transaction hash in hex
 * @param {function} cb Called on response with params (error, bitcoinjs-lib.Transaction)
 */
BlockchaininfoDataAPI.prototype.getTx = function(txHash, cb) {
  assert(_.isString(txHash), 'Expected string txHash, got ' + txHash)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

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
  BlockchainStateBase: BlockchainStateBase,
  BlockchaininfoDataAPI: BlockchaininfoDataAPI
}
