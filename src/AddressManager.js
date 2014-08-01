var assert = require('assert')
var _ = require('lodash')

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey
var HDNode = bitcoin.HDNode
var networks = Object.keys(bitcoin.networks).map(function(key) { return bitcoin.networks[key] })

var Address = require('./Address')
var store = require('./store')


function isHexString(s) {
  var set = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']

  return (_.isString(s) &&
          s.length % 2 === 0 &&
          s.toLowerCase().split('').every(function(x) { return set.indexOf(x) !== -1 }))
}

/**
 * @param {bitcoinjs-lib.HDNode} rootNode
 * @param {number} account
 * @param {number} chain
 * @param {number} index
 * @return {bitcoinjs-lib.HDNode}
 */
function derive(rootNode, account, chain, index) {
  assert(rootNode instanceof HDNode, 'Expected bitcoinjs-lib.HDNode rootNode, got ' + rootNode)
  assert(_.isNumber(account), 'Expected number account, got ' + account)
  assert(_.isNumber(chain), 'Expected number chain, got ' + chain)
  assert(_.isNumber(index), 'Expected number index, got ' + index)

  var node = rootNode
  var path = account + '\'/' + chain + '\'/' + index

  path.split('/').forEach(function(value) {
    var usePrivate = (value.length > 1) && (value[value.length - 1] === '\'')
    var childIndex = parseInt(usePrivate ? value.slice(0, value.length - 1) : value) & 0x7fffffff

    if (usePrivate)
      childIndex += 0x80000000

    node = node.derive(childIndex)
  })

  return node
}


/**
 * @class AddressManager
 *
 * @param {store.AddressStore} amStore
 */
function AddressManager(amStore) {
  assert(amStore instanceof store.AddressStore, 'Expected AddressStore amStore, got ' + amStore)

  this.amStore = amStore
  this.account = 0
  this.chain = 0
}

/**
 * Set masterKey from seed and drop all created addresses
 *
 * @param {Buffer|string} seed Buffer or hex string
 * @param {Object} network Network description from bitcoinjs-lib.networks
 */
AddressManager.prototype.setMasterKeyFromSeed = function(seed, network) {
  assert(Buffer.isBuffer(seed) || isHexString(seed), 'Expected Buffer or hex string seed, got ' + seed)
  assert(networks.indexOf(network) !== -1, 'Unknow network type, got ' + network)

  var node

  if (Buffer.isBuffer(seed))
    node = HDNode.fromSeedBuffer(seed, network)
  else
    node = HDNode.fromSeedHex(seed, network)

  this.setMasterKey(node.toBase58())
}

/**
 * Set masterKey and drop all created addresses
 *
 * @param {string} masterKey String in base58 format
 */
AddressManager.prototype.setMasterKey = function(masterKey) {
  HDNode.fromBase58(masterKey) // Check masterKey

  this.amStore.setMasterKey(masterKey)
}

/**
 * Get masterKey from storage in base58 format or undefined if not exists
 *
 * @return {string|undefined} masterKey in base58 format
 */
AddressManager.prototype.getMasterKey = function() {
  return this.amStore.getMasterKey()
}

/**
 * Get new address and save it to db
 *
 * @return {Address}
 */
AddressManager.prototype.getNewAddress = function() {
  var masterKey = this.getMasterKey()
  if (_.isUndefined(masterKey))
    throw new Error('set masterKey first')

  var maxIndex = this.amStore.getMaxIndex({ account: this.account, chain: this.chain })
  var newIndex = _.isUndefined(maxIndex) ? 0 : maxIndex + 1

  var newNode = derive(HDNode.fromBase58(masterKey), this.account, this.chain, newIndex)

  this.amStore.addPubKey({
    account: this.account,
    chain: this.chain,
    index: newIndex,
    pubKey: newNode.pubKey.toHex()
  })

  var newAddress = new Address({
    pubKey: newNode.pubKey,
    network: newNode.network
  })

  return newAddress
}

/**
 * Get all addresses
 *
 * @return {Array}
 */
AddressManager.prototype.getAllAddresses = function() {
  var masterKey = this.getMasterKey()
  if (_.isUndefined(masterKey))
    throw new Error('set masterKey first')

  var network = HDNode.fromBase58(masterKey).network

  function record2address(record) {
    return new Address({ pubKey: ECPubKey.fromHex(record.pubKey), network: network })
  }

  return this.amStore.getAllPubKeys({ account: this.account, chain: this.chain }).map(record2address)
}


module.exports = AddressManager
