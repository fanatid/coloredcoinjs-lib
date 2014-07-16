var assert = require('assert')
var _ = require('underscore')
var inherits = require('inherits')
var http = require('http')

var Transaction = require('./transaction')


/**
 * @class BlockchainStateBase
 */
function BlockchainStateBase() {}

/**
 * Get previous transaction for all tx.ins and
 *  return new transaction via callback cb
 *
 * @param {Transaction} tx
 * @param {function} cb Called on finished with params (error, Transaction|null)
 */
BlockchainStateBase.prototype.ensureInputValues = function(tx, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  tx = tx.clone()

  if (tx.ensured === true) {
    process.nextTick(function() { cb(null, tx) })
    return
  }

  var _this = this

  function processOne(index) {
    if (index === tx.ins.length) {
      tx.ensured = true
      cb(null, tx)
      return
    }

    var isCoinbase = (
      tx.ins[index].hash.toString('hex') === '0000000000000000000000000000000000000000000000000000000000000000' &&
      tx.ins[index].index === 4294967295)

    if (isCoinbase) {
      tx.ins[index].value = 0
      processOne(index+1)

    } else {
      var txHash = Array.prototype.reverse.call(new Buffer(tx.ins[index].hash)).toString('hex')

      _this.getTx(txHash, function(error, prevTx) {
        if (error === null) {
          tx.ins[index].prevTx = prevTx
          tx.ins[index].value = prevTx.outs[tx.ins[index].index].value
          processOne(index+1)

        } else {
          cb(error, null)
        }
      })
    }
  }

  process.nextTick(function() { processOne(0) })
}


/**
 * BlockchainState that uses [Blockchain Data API]{@link https://blockchain.info/api/blockchain_api}
 *
 * @class BlockchaininfoDataAPI
 *
 * Inherits BlockchainStateBase
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
 * @param {function} cb Called on response with params (error, Transaction)
 */
BlockchaininfoDataAPI.prototype.getTx = function(txHash, cb) {
  assert(_.isString(txHash), 'Expected string txHash, got ' + txHash)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.request('/rawtx/' + txHash + '?format=hex', function(error, response) {
    if (error === null) {
      try {
        response = Transaction.fromHex(response)
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
