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
 * @param {number} [opts.requestTimeout=5*1000]
 * @param {number} [opts.maxCacheSize=500]
 * @param {number} [opts.maxCacheAge=10*1000] Cache live in ms
 */
function BlockrIOAPI(opts) {
  opts = _.extend({
    testnet: false,
    requestTimeout: 5*100,
    maxCacheSize: 500,
    maxCacheAge: 10*100
  }, opts)


  BlockchainStateBase.call(this)

  this.isTestnet = opts.testnet

  this.cache = LRU({
    max: opts.maxCacheSize,
    maxAge: opts.maxCacheAge
  })

  this.requestTimeout = opts.requestTimeout
  this.requestPathCache = LRU({ maxAge: this.requestTimeout })
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
  if (_.isFunction(data) && _.isUndefined(cb)) {
    cb = data
    data = null
  }

  var self = this

  function makeRequest(resolve, reject) {
    self.requestPathCache.set(path, true)
    var requestOpts = {
      scheme: 'http',
      host: self.isTestnet ? 'tbtc.blockr.io' : 'btc.blockr.io',
      port: 80,
      path: path,
      method: data === null ? 'GET' : 'POST',
      withCredentials: false
    }
    var request = http.request(requestOpts)

    request.on('response', function(response) {
      var buf = ''

      response.on('data', function(data) {
        buf += data
      })

      response.on('end', function() {
        var result
        var error = null

        try {
          result = JSON.parse(buf)
          if (result.status !== 'success') {
            if (result.message)
              throw new Error(result.message)
            throw new Error('Bad data')
          }

        } catch (error) {
          reject(error)

        }

        resolve(result.data)
      })

      response.on('error', reject)
    })

    request.on('error', reject)

    Q.delay(self.requestTimeout).then(function() {
      /*
       * See: https://github.com/substack/http-browserify/issues/49
       *
       * https://github.com/substack/http-browserify/blob/master/lib/request.js##L95
       * In http-browserify instead request.abort() must be called request.destroy() ?
       */
      if (request.abort)
        request.abort()
      else
        request.destroy

      reject(new Error('Request timeout'))
    })

    if (data !== null)
      request.write(querystring.encode(data))

    request.end()
  }

  function checkCache() {
    /** check in cache */
    var cachedValue = self.cache.get(path)
    if (!_.isUndefined(cachedValue))
      return cachedValue

    /** check already requested */
    if (!_.isUndefined(self.requestPathCache.get(path)))
      return Q.delay(100).then(checkCache)

    return Q.Promise(makeRequest)
  }

  Q.fcall(checkCache)
  .done(function(response) { cb(null, response) }, function(error) { cb(error) })
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
  var self = this

  Q.fcall(function() {
    return Q.ninvoke(self, 'request', '/api/v1/block/info/last')

  }).then(function(response) {
    if (!_.isNumber(response.nb))
      throw new Error('Expected number nb, got ' + response.nb)

    return response.nb

  }).done(function(blockCount) { cb(null, blockCount) }, function(error) { cb(error) })
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
  var self = this

  Q.fcall(function() {
    return Q.ninvoke(self, 'request', '/api/v1/tx/raw/' + txId)

  }).then(function(response) {
    return Transaction.fromHex(response.tx.hex)

  }).done(function(tx) { cb(null, tx) }, function(error) { cb(error) })
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
  var self = this

  Q.fcall(function() {
    return Q.ninvoke(self, 'request', '/api/v1/tx/push', { 'hex': tx.toHex() })

  }).done(function(txId) { cb(null, txId) }, function(error) { cb(error) })
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
  var self = this

  Q.fcall(function() {
    return Q.ninvoke(self, 'request', '/api/v1/address/unspent/' + address + '?unconfirmed=1')

  }).then(function(response) {
    if (response.address !== address)
      throw new Error('response address not matched')

    return response.unspent

  }).then(function(coins) {
    var utxo = coins.map(function(coin) {
      assert(isHexString(coin.tx), 'Expected hex string tx, got ' + coin.tx)
      assert(_.isNumber(coin.n), 'Expected number n, got ' + coin.n)
      assert(_.isString(coin.amount), 'Expected string amount, got ' + coin.amount)
      assert(_.isNumber(coin.confirmations), 'Expected number confirmations, got ' + coin.confirmations)

      var value = parseAmount(coin.amount)
      if (isNaN(value))
        throw new TypeError('bad coin value')

      return {
        address: address,
        txId: coin.tx,
        outIndex: coin.n,
        value: value,
        confirmations: coin.confirmations
      }
    })

    return utxo

  }).done(function(utxo) { cb(null, utxo) }, function(error) { cb(error) })
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
  var self = this

  Q.fcall(function() {
    return Q.ninvoke(self, 'request', '/api/v1/address/txs/' + address)

  }).then(function(response) {
    if (response.address !== address)
      throw new Error('response address not matched')

    return response.txs

  }).then(function(txs) {
    var records = txs.map(function(tx) {
      return { txId: tx.tx, confirmations: tx.confirmations }
    })

    records.sort(function(r1, r2) {
      return r2.confirmations - r1.confirmations
    })

    return records

  }).done(function(records) { cb(null, records) }, function(error) { cb(error) })
}


module.exports = BlockrIOAPI
