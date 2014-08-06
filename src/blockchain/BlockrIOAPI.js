var assert = require('assert')
var http = require('http')
var inherits = require('util').inherits

var _ = require('lodash')
var LRU = require('lru-cache')

var BlockchainStateBase = require('./BlockchainStateBase')
var Transaction = require('../Transaction')


function isHexString(s) {
  var set = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']

  return (_.isString(s) &&
          s.length % 2 === 0 &&
          s.toLowerCase().split('').every(function(x) { return set.indexOf(x) !== -1 }))
}

/**
 * BlockchainState that uses [Blockr.io API]{@link http://btc.blockr.io/documentation/api}
 *
 * @class BlockrIOAPI
 *
 * Inherits BlockchainStateBase
 *
 * @param {Object} opts
 * @param {boolean} opts.testnet
 * @param {number} [opts.maxCacheSize=500]
 * @param {number} [opts.maxCacheAge=10*1000] Cache live in ms
 */
function BlockrIOAPI(opts) {
  opts = _.isUndefined(opts) ? {} : opts
  assert(_.isObject(opts), 'Expected Object opts, got ' + opts)

  opts.testnet = _.isUndefined(opts.testnet) ? false : opts.testnet
  assert(_.isBoolean(opts.testnet), 'Expected boolean opts.testnet, got ' + opts.testnet)

  opts.maxCacheSize = _.isUndefined(opts.maxCacheSize) ? 500 : opts.maxCacheSize
  assert(_.isNumber(opts.maxCacheSize), 'Expected number opts.maxCacheSize, got ' + opts.maxCacheSize)

  opts.maxCacheAge = _.isUndefined(opts.maxCacheAge) ? 10*1000 : opts.maxCacheAge
  assert(_.isNumber(opts.maxCacheAge), 'Expected number opts.maxCacheAge, got ' + opts.maxCacheAge)


  BlockchainStateBase.call(this)

  this.isTestnet = opts.testnet

  this.cache = LRU({
    max: opts.maxCacheSize,
    maxAge: opts.maxCacheAge
  })

  this.requestPathCacheSize = 100
  this.requestPathCacheMaxAge = 2*1000
  this.requestPathCache = LRU({
    max: this.requestPathCacheSize,
    maxAge: this.requestPathCacheMaxAge
  })
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

  var _this = this

  /** check in cache */
  var cachedValue = this.cache.get(path)
  if (!_.isUndefined(cachedValue)) {
    process.nextTick(function() { cb(null, cachedValue) })
    return
  }

  /** check already requested */
  cachedValue = this.requestPathCache.get(path)
  if (!_.isUndefined(cachedValue)) {
    setTimeout(function() { _this.request(path, cb) }, 100)
    return
  }

  /** request */
  this.requestPathCache.set(path, true)
  var request = http.request({
    scheme: 'http',
    host: this.isTestnet ? 'tbtc.blockr.io' : 'btc.blockr.io',
    port: 80,
    path: path,
    method: 'GET',
    withCredentials: false
  })

  request.on('response', function(res) {
    var buf = ''

    res.on('data', function(data) {
      buf += data
    })

    res.on('end', function() {
      var result
      var error = null

      try {
        result = JSON.parse(buf)
        if (result.status !== 'success')
          error = result.message || new Error('Bad data')

      } catch (newError) {
        error = newError

      }

      if (error === null)
        _this.cache.set(path, result.data)

      cb(error, error === null ? result.data : undefined)
    })

    res.on('error', function(error) {
      cb(error)
    })
  })

/*
 * See: https://github.com/substack/http-browserify/issues/49
 *
 * https://github.com/substack/http-browserify/blob/master/lib/request.js#L87
 * In http-browserify instead request.abort() myst be called request.destroy() ?
 */

//  request.setTimeout(this.requestPathCacheMaxAge, function() {
//    request.abort()
//  })

  request.on('error', function(error) {
    cb(error)
  })

  request.end()
}

/**
 * Get block count in blockchain
 *
 * @param {function} cb Called on response with params  (error, number)
 */
BlockrIOAPI.prototype.getBlockCount = function(cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.request('/api/v1/block/info/last', function(error, response) {
    if (error === null) {
      try {
        assert(_.isNumber(response.nb), 'Expected number nb, got ' + response.nb)

      } catch (newError) {
        error = newError
      }
    }

    cb(error, error === null ? response.nb : undefined)
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

    cb(error, error === null ? response : undefined)
  })
}

function parseAmount(amount) {
  var items = amount.split('.')
  return parseInt(items[0])*100000000 + parseInt(items[1])
}

/**
 *
 * @param {string} address
 * @param {function} cb Called on finished with params (error, Array)
 */
BlockrIOAPI.prototype.getUTXO = function(address, cb) {
  assert(_.isString(address), 'Expected Address address, got ' + address)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.request('/api/v1/address/unspent/' + address + '?unconfirmed=1', function(error, response) {
    var utxo

    if (error === null && response.address !== address)
      error = new Error('response address not matched')

    if (error === null) {
      try {
        utxo = response.unspent.map(function(txOut) {
          assert(isHexString(txOut.tx), 'Expected hex string tx, got ' + txOut.tx)
          assert(_.isNumber(txOut.n), 'Expected number n, got ' + txOut.n)
          assert(_.isString(txOut.amount), 'Expected string amount, got ' + txOut.amount)
          assert(_.isNumber(txOut.confirmations), 'Expected number confirmations, got ' + txOut.confirmations)

          var value = parseAmount(txOut.amount)
          if (isNaN(value))
            throw new TypeError('bad txOut value')

          return {
            txId: txOut.tx,
            outIndex: txOut.n,
            value: value,
            confirmations: txOut.confirmations
          }
        })

      } catch (newError) {
        error = newError
      }
    }

    cb(error, error === null ? utxo : undefined)
  })

}


module.exports = BlockrIOAPI
