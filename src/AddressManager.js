var assert = require('assert')
var _ = require('underscore')

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey
var HDNode = bitcoin.HDNode

var networks = Object.keys(bitcoin.networks).map(function(key) { return bitcoin.networks[key] })

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
 * @class Address
 *
 * @param {Object} opts
 * @param {bitcoinjs-lib.ECPubKey} opts.pubKey
 * @param {Object} opts.network Network description from bitcoinjs-lib.networks
 */
function Address(opts) {
  assert(_.isObject(opts), 'Expected Object opts, got ' + opts)
  assert(opts.pubKey instanceof ECPubKey, 'Expected bitcoinjs-lib.ECPubKey opts.pubKey, got ' + opts.pubKey)
  assert(networks.indexOf(opts.network) !== -1, 'Unknow network type, got ' + opts.network)

  this.pubKey = opts.pubKey
  this.network = opts.network
}

/**
 * Return address for network (bitcoin, testnet)
 */
Address.prototype.getAddress = function() {
  return this.pubKey.getAddress(this.network).toBase58Check()
}

Address.prototype.toString = Address.prototype.getAddress


/**
 * @class AddressManager
 *
 * @param {store.AddressManagerStore} amStore
 */
function AddressManager(amStore) {
  assert(amStore instanceof store.AddressManagerStore, 'Expected AddressManagerStore amStore, got ' + amStore)

  this.amStore = amStore
  this.account = 0
  this.chain = 0
}

/**
 * Set masterKey from seed and drop all created addresses
 *
 * @param {Buffer|string} seed Buffer or hex string
 * @param {Object} network Network description from bitcoinjs-lib.networks
 * @param {function} cb Called on finished with params (error, changed)
 */
AddressManager.prototype.setMasterKeyFromSeed = function(seed, network, cb) {
  assert(Buffer.isBuffer(seed) || isHexString(seed), 'Expected Buffer or hex string seed, got ' + seed)
  assert(networks.indexOf(network) !== -1, 'Unknow network type, got ' + network)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var node

  if (Buffer.isBuffer(seed))
    node = HDNode.fromSeedBuffer(seed, network)
  else
    node = HDNode.fromSeedHex(seed, network)

  this.setMasterKey(node.toBase58(), cb)
}

/**
 * Set masterKey and drop all created addresses
 *
 * @param {string} masterKey String in base58 format
 * @param {function} cb Called on finished with params (error, changed)
 */
AddressManager.prototype.setMasterKey = function(masterKey, cb) {
  HDNode.fromBase58(masterKey) // Check masterKey
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.amStore.setMasterKey(masterKey, cb)
}

/**
 * Get masterKey from storage in base58 format or null if not exists
 *
 * @param {function} cb Called on finished with params (error, string|null)
 */
AddressManager.prototype.getMasterKey = function(cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  this.amStore.getMasterKey(cb)
}

/**
 * Get new address and save it to db
 *
 * @param {function} cb Called on finished with params (error, Address)
 */
AddressManager.prototype.getNewAddress = function(cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  function tryCreateNewAddress(rootNode) {
    _this.amStore.getMaxIndex(_this.account, _this.chain, function(error, index) {
      if (error) {
        cb(error)
        return
      }

      index = index === null ? 0 : index + 1
      var pubKey = derive(rootNode, _this.account, _this.chain, index).pubKey

      _this.amStore.addPubKey(_this.account, _this.chain, index, pubKey, function(error, added) {
        if (error) {
          cb(error)
          return
        }

        if (added)
          cb(null, new Address({ pubKey: pubKey, network: rootNode.network }))
        else
          tryCreateNewAddress(rootNode)
      })
    })
  }

  this.getMasterKey(function(error, masterKey) {
    if (error === null && masterKey === null)
      error = new Error('masterKey not found')

    if (error)
      cb(error)
    else
      tryCreateNewAddress(HDNode.fromBase58(masterKey))
  })
}

/**
 * Get all addresses
 *
 * @param {function} cb Called on finished with params (error, array)
 */
AddressManager.prototype.getAllAddresses = function(cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  this.getMasterKey(function(error, masterKey) {
    if (error === null && masterKey === null)
      error = new Error('masterKey not found')

    if (error) {
      cb(error)
      return
    }

    _this.amStore.getAllPubKeys(_this.account, _this.chain, function(error, records) {
      if (error) {
        cb(error)
        return
      }

      var network = HDNode.fromBase58(masterKey).network

      var addresses = records.map(function(record) {
        return new Address({ pubKey: record.pubKey, network: network })
      })

      cb(null, addresses)
    })
  })
}


module.exports = AddressManager
