var assert = require('assert')
var _ = require('underscore')
var inherits = require('util').inherits

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey
var HDNode = bitcoin.HDNode

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

  if (this._dbType === 'memory') {
    if (!_.isArray(this._db.pubKeys))
      this._db.pubKeys = []

    if (!_.isString(this._db.masterKey)) {
      delete this._db.masterKey
      this._db.pubKeys = []
    }
  }
}

inherits(AddressManagerStore, DataStore)

/**
 * Save masterKey in base58 format
 *
 * @param {string} masterKey
 * @param {function} cb Called on finished with params (error, changed)
 */
AddressManagerStore.prototype.setMasterKey = function(newMasterKey, cb) {
  HDNode.fromBase58(newMasterKey) // Check masterKey
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  this.getMasterKey(function(error, masterKey) {
    if (error) {
      cb(error)
      return
    }

    if (_this._dbType === 'memory') {
      _this._db.masterKey = newMasterKey
      _this._db.pubKeys = []
      process.nextTick(function() { cb(null, masterKey !== newMasterKey) })
    }
  })
}

/**
 * Get masterKey from storage in base58
 *
 * @param {function} cb Called on finished with params (error, string|null)
 */
AddressManagerStore.prototype.getMasterKey = function(cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  if (this._dbType === 'memory') {
    process.nextTick(function() { cb(null, _this._db.masterKey || null) })
  }
}

/*
 * Add pubKey for account, chain and index to storage
 *
 * @param {number} account
 * @param {number} chain
 * @param {number} index
 * @param {bitcoinjs-lib.ECPubKey} pubKey
 * @param {function} cb Called on finished with params (error, added)
 */
AddressManagerStore.prototype.addPubKey = function(account, chain, index, pubKey, cb) {
  assert(_.isNumber(account), 'Expected number account, got ' + account)
  assert(_.isNumber(chain), 'Expected number chain, got ' + chain)
  assert(_.isNumber(index), 'Expected number index, got ' + index)
  assert(pubKey instanceof ECPubKey, 'Expected bitcoinjs-lib.ECPubKey pubKey, got ' + pubKey)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  if (this._dbType === 'memory') {
    var exists = this._db.pubKeys.some(function(record) {
      return (record.account === account && 
              record.chain === chain &&
              record.index === index)
    })

    if (!exists)
      this._db.pubKeys.push({
        account: account,
        chain: chain,
        index: index,
        pubKey: pubKey
      })

    process.nextTick(function() { cb(null, !exists) })
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

  if (this._dbType === 'memory') {
    var result = this._db.pubKeys.filter(function(record) {
      return (record.account === account && record.chain === chain)
    })

    process.nextTick(function() { cb(null, result) })
  }
}

/**
 * Get max index for account and chain
 *
 * @param {number} account
 * @param {number} chain
 * @param {function} cb Called on finished with params (error, index|null)
 */
AddressManagerStore.prototype.getMaxIndex = function(account, chain, cb) {
  assert(_.isNumber(account), 'Expected number account, got ' + account)
  assert(_.isNumber(chain), 'Expected number chain, got ' + chain)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var maxIndex

  if (this._dbType === 'memory') {
    this._db.pubKeys.forEach(function(record) {
      if (record.account === account && record.chain === chain && (record.index > maxIndex || _.isUndefined(maxIndex)))
        maxIndex = record.index
    })

    process.nextTick(function() { cb(null, _.isUndefined(maxIndex) ? null : maxIndex) })
  }
}


module.exports = AddressManagerStore
