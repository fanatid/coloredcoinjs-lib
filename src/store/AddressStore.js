var assert = require('assert')
var inherits = require('util').inherits

var _ = require('lodash')
var bitcoin = require('bitcoinjs-lib')
var HDNode = bitcoin.HDNode

var DataStore = require('./DataStore')


function isHexString(s) {
  var set = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']

  return (_.isString(s) &&
          s.length % 2 === 0 &&
          s.toLowerCase().split('').every(function(x) { return set.indexOf(x) !== -1 }))
}

/**
 * @class AddressStore
 *
 * Inherits DataStore
 */
function AddressStore() {
  DataStore.apply(this, Array.prototype.slice.call(arguments))

  this.masterKeyDBKey = DataStore.globalPrefix + 'masterKey'
  this.pubKeysDBKey = DataStore.globalPrefix + 'pubKeys'
  /* test-code */
  this.masterKeyDBKey = this.masterKeyDBKey + '_tests'
  this.pubKeysDBKey = this.masterKeyDBKey + '_tests'
  /* end-test-code */

  if (!_.isString(this.store.get(this.masterKeyDBKey))) {
    this.store.remove(this.masterKeyDBKey)
    this.store.set(this.pubKeysDBKey, [])
  }

  if (!_.isArray(this.store.get(this.pubKeysDBKey)))
    this.store.set(this.pubKeysDBKey, [])
}

inherits(AddressStore, DataStore)

/**
 * Save masterKey in base58 format
 *
 * @param {string} masterKey
 */
AddressStore.prototype.setMasterKey = function(newMasterKey) {
  HDNode.fromBase58(newMasterKey) // Check masterKey

  this.store.set(this.masterKeyDBKey, newMasterKey)
  this.store.set(this.pubKeysDBKey, [])
}

/**
 * Get masterKey from store in base58
 *
 * @return {srting|undefined}
 */
AddressStore.prototype.getMasterKey = function() {
  return this.store.get(this.masterKeyDBKey)
}

/*
 * Add pubKey for account, chain and index to store
 *
 * @param {Object} data
 * @param {number} data.account
 * @param {number} data.chain
 * @param {number} data.index
 * @param {string} data.pubKey bitcoinjs-lib.ECPubKey in hex format
 */
AddressStore.prototype.addPubKey = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isNumber(data.account), 'Expected number data.account, got ' + data.account)
  assert(_.isNumber(data.chain), 'Expected number data.chain, got ' + data.chain)
  assert(_.isNumber(data.index), 'Expected number data.index, got ' + data.index)
  assert(isHexString(data.pubKey), 'Expected hex string data.pubKey, got ' + data.pubKey)

  var pubKeys = this.store.get(this.pubKeysDBKey) || []

  pubKeys.forEach(function(record) {
    if ((record.account === data.account && record.chain === data.chain && record.index === data.index) ||
        record.pubKey === data.pubKey)
      throw new Error('UniqueConstraint')
  })

  pubKeys.push({
    account: data.account,
    chain: data.chain,
    index: data.index,
    pubKey: data.pubKey
  })

  this.store.set(this.pubKeysDBKey, pubKeys)
}

/**
 * Get all pubKeys for account and chain
 *
 * @param {Object} data
 * @param {number} data.account
 * @param {number} data.chain
 * @return {Array}
 */
AddressStore.prototype.getAllPubKeys = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isNumber(data.account), 'Expected number data.account, got ' + data.account)
  assert(_.isNumber(data.chain), 'Expected number data.chain, got ' + data.chain)

  var pubKeys = this.store.get(this.pubKeysDBKey) || []

  function isGoodRecord(record) {
    return (record.account === data.account && record.chain === data.chain)
  }

  return pubKeys.filter(isGoodRecord)
}

/**
 * Get max index for account and chain
 *
 * @param {Object} data
 * @param {number} data.account
 * @param {number} data.chain
 * @return {number|undefined}
 */
AddressStore.prototype.getMaxIndex = function(data) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(_.isNumber(data.account), 'Expected number data.account, got ' + data.account)
  assert(_.isNumber(data.chain), 'Expected number data.chain, got ' + data.chain)

  var maxIndex

  var pubKeys = this.store.get(this.pubKeysDBKey) || []
  pubKeys.forEach(function(record) {
    if (record.account === data.account && record.chain === data.chain &&
       (record.index > maxIndex || _.isUndefined(maxIndex)))
      maxIndex = record.index
  })

  return maxIndex
}

/**
 * Remove masterKey and all pubKeys
 */
AddressStore.prototype.clear = function() {
  this.store.remove(this.masterKeyDBKey)
  this.store.remove(this.pubKeysDBKey)
}


module.exports = AddressStore
