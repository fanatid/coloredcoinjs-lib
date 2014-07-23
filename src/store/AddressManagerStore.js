var assert = require('assert')
var _ = require('underscore')
var inherits = require('util').inherits

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey

var DataStore = require('./DataStore')


/**
 * @class AddressManagerStore
 *
 * Inherits DataStore
 *
 * @param {string} type DB type
 * @param {Object} opts DB options
 */
function AddressManagerStore() {
  DataStore.apply(this, Array.prototype.slice.call(arguments))

  if (!_.isObject(this._db.pubKeys))
    this._db.pubKeys = {}
}

inherits(AddressManagerStore, DataStore)

/*
 * Add derivation path and pubKey to storage
 *
 * @param {string} path Derivation path
 * @param {bitcoinjs-lib.ECPubKey} pubKey
 * @param {function} cb Called on finished with params (error)
 */
AddressManagerStore.prototype.addPubKey = function(path, pubKey, cb) {
  assert(_.isString(path), 'Expected string path, got ' + path)
  assert(pubKey instanceof ECPubKey, 'Expected bitcoinjs-lib.ECPubKey pubKey, got ' + pubKey)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (this._dbType === 'memory') {
    this._db.pubKeys[path] = pubKey

    process.nextTick(function() { cb(null) })
  }
}

/**
 * Get pubKey by account, chain and index
 *
 * @param {number} account
 * @param {number} chain
 * @param {number} index
 * @param {function} cb Called on finished with params (error, object)
 */
AddressManagerStore.prototype.getPubKey = function(account, chain, index, cb) {
  assert(_.isNumber(account), 'Expected number account, got ' + account)
  assert(_.isNumber(chain), 'Expected number chain, got ' + chain)
  assert(_.isNumber(index), 'Expected number index, got ' + index)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var path = 'm/' + account + '\'/' + chain + '\'/' + index

  if (this._dbType === 'memory') {
    var pubKey = this._db.pubKeys[path]

    process.nextTick(function() { cb(null, pubKey ? { path: path, pubKey: pubKey } : null) })
  }
}

/**
 * Get all pubKeys for account and chain
 *
 * @param {number} account
 * @param {number} chain
 * @param {function} cb Called on finished with params (error, array)
 */
AddressManagerStore.prototype.getAllPubKeys = function(account, chain, cb) {
  assert(_.isNumber(account), 'Expected number account, got ' + account)
  assert(_.isNumber(chain), 'Expected number chain, got ' + chain)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  account = account + '\''
  chain = chain + '\''

  var _this = this
  var result = []

  if (this._dbType === 'memory') {
    Object.keys(this._db.pubKeys).forEach(function(path) {
      var items = path.split('/')

      if (items[0] === 'm' && items[1] === account && items[2] === chain && !isNaN(parseInt(items[3])))
        result.push({ path: path, pubKey: _this._db.pubKeys[path] })
    })

    process.nextTick(function() { cb(null, result) })
  }
}

/**
 * Get max index for account and chain
 *
 * @param {number} account
 * @param {number} chain
 * @param {function} cb Called on finished with params (error, index|undefined)
 */
AddressManagerStore.prototype.getMaxIndex = function(account, chain, cb) {
  assert(_.isNumber(account), 'Expected number account, got ' + account)
  assert(_.isNumber(chain), 'Expected number chain, got ' + chain)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  account = account + '\''
  chain = chain + '\''

  var maxIndex

  if (this._dbType === 'memory') {
    Object.keys(this._db.pubKeys).forEach(function(path) {
      var items = path.split('/')
      var index = parseInt(items[3])

      if (items[0] === 'm' && items[1] === account && items[2] === chain &&
          !isNaN(index) && (index > maxIndex || _.isUndefined(maxIndex)))
        maxIndex = index
    })

    process.nextTick(function() { cb(null, maxIndex) })
  }
}


module.exports = AddressManagerStore
