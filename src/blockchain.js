var assert = require('assert')
var _ = require('underscore')
var inherits = require('util').inherits
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
      var txId = Array.prototype.reverse.call(new Buffer(tx.ins[index].hash)).toString('hex')

      _this.getTx(txId, function(error, prevTx) {
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
  opts.isTestnet = _.isUndefined(opts.isTestnet) ? false : opts.isTestnet

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


module.exports = {
  BlockchainStateBase: BlockchainStateBase,
  BlockrIOAPI: BlockrIOAPI
}
