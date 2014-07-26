var assert = require('assert')
var http = require('http')
var inherits = require('util').inherits

var _ = require('underscore')

var BlockchainStateBase = require('./BlockchainStateBase')
var Transaction = require('../Transaction')


/**
 * BlockchainState that uses [Blockr.io API]{@link http://btc.blockr.io/documentation/api}
 *
 * @class BlockrIOAPI
 *
 * Inherits BlockchainStateBase
 *
 * @param opts
 * @param opts.isTestnet boolean
 */
function BlockrIOAPI(opts) {
  opts = opts || {}
  opts.isTestnet = opts.isTestnet || false

  assert(_.isBoolean(opts.isTestnet), 'Expected boolean opts.isTestnet, got ' + opts.isTestnet)

  BlockchainStateBase.call(this)

  this.isTestnet = opts.isTestnet
}

inherits(BlockrIOAPI, BlockchainStateBase)

/**
 * Make request to the server
 *
 * @param {string} path Path to resource
 * @param {function} cb Called on response with params  (error, string)
 */
BlockrIOAPI.prototype.request = function(path, cb) {
  assert(_.isString(path), 'Expected string path, got ' + path)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var opts = {
    scheme: 'http',
    host: this.isTestnet ? 'tbtc.blockr.io' : 'btc.blockr.io',
    port: 80,
    path: path,
    method: 'GET',
    withCredentials: false
  }

  http.request(opts, function(res) {
    var buf = ''

    res.on('data', function(data) {
      buf += data
    })

    res.on('end', function() {

      try {
        var result = JSON.parse(buf)

        if (result.status === 'success')
          cb(null, result.data)
        else
          cb(result.message || new Error('Bad data'))

      } catch (error) {
        cb(error)

      }
    })

    res.on('error', function(error) {
      cb(error, null)
    })
  }).end()
}

/**
 * Get block count in blockchain
 *
 * @param {function} cb Called on response with params  (error, number)
 */
BlockrIOAPI.prototype.getBlockCount = function(cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.request('/api/v1/block/info/last', function(error, response) {
    var blockCount = parseInt(response.nb)

    if (isNaN(blockCount))
      cb(new Error('Bad block number'))
    else
      cb(error, blockCount)
  })
}

/**
 * Get transaction by txId
 *
 * @param {string} txId Transaction id
 * @param {function} cb Called on response with params (error, Transaction)
 */
BlockrIOAPI.prototype.getTx = function(txId, cb) {
  assert(Transaction.isTxId(txId), 'Expected transaction id txId, got ' + txId)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.request('/api/v1/tx/raw/' + txId, function(error, response) {
    if (error === null) {
      try {
        response = Transaction.fromHex(response.tx.hex)
      } catch (newError) {
        error = newError
      }
    }

    if (error === null)
      cb(null, response)
    else
      cb(error)
  })
}

module.exports = BlockrIOAPI
