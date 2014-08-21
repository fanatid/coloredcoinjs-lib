var assert = require('assert')
var http = require('http')
var inherits = require('util').inherits

var _ = require('lodash')
var Q = require('q')
var LRU = require('lru-cache')
var querystring = require('querystring')

var BlockchainStateBase = require('./BlockchainStateBase')
var Transaction = require('../tx').Transaction


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
  this.requestPathCacheMaxAge = 5*1000
  this.requestPathCache = LRU({
    max: this.requestPathCacheSize,
    maxAge: this.requestPathCacheMaxAge
  })
}

inherits(BlockrIOAPI, BlockchainStateBase)

/**
 * @callback BlockrIOAPI~request
 * @param {?Error} error
 * @param {string} response
 */

/**
 * Make request to the server
 *
 * @param {string} path Path to resource
 * @param {Object} [data=null] Data for POST request, may be missed
 * @param {BlockrIOAPI~request} cb
 */
BlockrIOAPI.prototype.request = function(path, data, cb) {
  assert(_.isString(path), 'Expected string path, got ' + path)
  data = _.isUndefined(data) ? null : data
  if (_.isFunction(data) && _.isUndefined(cb)) {
    cb = data
    data = null
  }
  assert(_.isObject(data) || _.isNull(data), 'Expected Object|null data, got ' + data)
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

  function done(error, result) {
    if (!_.isUndefined(cb)) {
      cb(error, result)
      cb = undefined
    }
  }

  /** request */
  this.requestPathCache.set(path, true)
  var requestOpts = {
    scheme: 'http',
    host: this.isTestnet ? 'tbtc.blockr.io' : 'btc.blockr.io',
    port: 80,
    path: path,
    method: data === null ? 'GET' : 'POST',
    withCredentials: false
  }
  var request = http.request(requestOpts)

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

      done(error, error === null ? result.data : undefined)
    })

    res.on('error', function(error) {
      done(error)
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

  setTimeout(function() {
    if (request.abort)
      request.abort()
    else
      request.destroy()

    done(new Error('Request timeout'))
  }, this.requestPathCacheMaxAge)

  request.on('error', function(error) {
    done(error)
  })

  if (data !== null)
    request.write(querystring.encode(data))

  request.end()
}

/**
 * @callback BlockrIOAPI~getBlockCount
 * @param {?Error} error
 * @param {number} blockCount
 */

/**
 * Get block count in blockchain
 *
 * @param {BlockrIOAPI~getBlockCount} cb
 */
BlockrIOAPI.prototype.getBlockCount = function(cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.request('/api/v1/block/info/last', function(error, response) {
    if (error === null && !_.isNumber(response.nb))
      error = new Error('Expected number nb, got ' + response.nb)

    cb(error, error === null ? response.nb : undefined)
  })
}

/**
 * @callback BlockrIOAPI~getTx
 * @param {?Error} error
 * @param {Transaction} tx
 */

/**
 * Get transaction by txId
 *
 * @param {string} txId Transaction id
 * @param {BlockrIOAPI~getTx} cb
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

/**
 * @callback BlockrIOAPI~sendTx
 * @param {?Error} error
 * @param {string} txId
 */

/**
 * Send transaction tx to server which broadcast tx to network
 *
 * @param {Transaction} tx
 * @param {BlockrIOAPI~sendTx} cb
 */
BlockrIOAPI.prototype.sendTx = function(tx, cb) {
  assert(tx instanceof Transaction, 'Expected tx instance of Transaction, got ' + tx)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.request('/api/v1/tx/push', { 'hex': tx.toHex() }, cb)
}

/**
 * Parse bitcoin amount (BlockrIO give us btc value not satoshi)
 *
 * @param {string} amount
 * @return {number}
 */
function parseAmount(amount) {
  var items = amount.split('.')
  return parseInt(items[0])*100000000 + parseInt(items[1])
}

/**
 * @typedef UTXO
 * @type {Object}
 * @property {string} txId Transaction id
 * @property {number} outIndex Output index
 * @property {number} value Coin value in satoshi
 * @property {number} confrimations Number of transaction confirmation
 */

/**
 * @callback BlockrIOAPI~getUTXO
 * @param {?Error} error
 * @param {UTXO[]} utxo
 */

/**
 * Get UTXO for given address
 * @abstract
 * @param {string} address
 * @param {BlockrIOAPI~getUTXO} cb
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
            address: address,
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

/**
 * @typedef HistoryObject
 * @type {Object}
 * @property {string} txId
 * @property {number} confirmations
 */

/**
 * @callback BlockrIOAPI~getHistory
 * @param {?Error} error
 * @param {HistoryObject} records
 */

/**
 * Get transaction Ids for given address
 * @abstract
 * @param {string} address
 * @param {BlockrIOAPI~getHistory} cb
 */
BlockrIOAPI.prototype.getHistory = function(address, cb) {
  assert(_.isString(address), 'Expected Address address, got ' + address)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var self = this

  Q.fcall(function() {
    return Q.ninvoke(self, 'request', '/api/v1/address/txs/' + address)

  }).then(function(response) {
    if (response.address !== address)
      throw new Error('response address not matched')

    var records = response.txs.map(function(record) {
      return { txId: record.tx, confirmations: record.confirmations }
    })

    records.sort(function(r1, r2) {
      return r2.confirmations - r1.confirmations
    })

    return records

  }).then(function(records) {
    cb(null, records)

  }).catch(function(error) {
    cb(error)

  }).done()
}


module.exports = BlockrIOAPI
