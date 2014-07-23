var assert = require('assert')
var _ = require('underscore')

var bitcoin = require('bitcoinjs-lib')
var ECKey = bitcoin.ECKey
var ECPubKey = bitcoin.ECPubKey
var HDNode = bitcoin.HDNode

var networks = Object.keys(bitcoin.networks).map(function(key) { return bitcoin.networks[key] })


function isHexString(s) {
  var set = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']

  return (_.isString(s) &&
          s.toLowerCase().split('').every(function(x) { return set.indexOf(x) !== -1 }))
}


/**
 * @class Address
 *
 * @param {Object} opts
 * @param {string} opts.path
 * @param {bitcoinjs-lib.ECKey} opts.privKey
 * @param {bitcoinjs-lib.ECPubKey} opts.pubKey
 * @param {Object} opts.network Network description from bitcoinjs-lib.networks
 */
function Address(opts) {
  opts = opts || {}

  assert(_.isString(opts.path), 'Expected string opts.path, got ' + opts.path)
  assert(opts.privKey instanceof ECKey, 'Expected bitcoinjs-lib.ECKey opts.privKey, got ' + opts.privKey)
  assert(opts.pubKey instanceof ECPubKey, 'Expected bitcoinjs-lib.ECPubKey opts.pubKey, got ' + opts.pubKey)
  assert(networks.indexOf(opts.network) !== -1, 'Unknow network type, got ' + opts.network)

  this.path = opts.path
  this.privKey = opts.privKey
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
 * @param {Buffer|string} masterKey
 */
function AddressManager(masterKey) {
  if (Buffer.isBuffer(masterKey))
    this.rootHDNode = HDNode.fromBuffer(masterKey)
  else if (isHexString(masterKey))
    this.rootHDNode = HDNode.fromHex(masterKey)
  else
    this.rootHDNode = HDNode.fromBase58(masterKey)
}

/**
 * @param {Buffer|string} seed
 * @param {Object} network Network description from bitcoinjs-lib.networks
 * @return {string}
 */
AddressManager.getMasterKeyFromSeed = function(seed, network) {
  var node

  if (Buffer.isBuffer(seed))
    node = HDNode.fromSeedBuffer(seed, network)
  else
    node = HDNode.fromSeedHex(seed, network)

  return node.toHex()
}

/**
 * @param {string} [format=hex] buffer, hex or base58
 */
AddressManager.prototype.getMasterKey = function(format) {
  format = format || 'hex'

  assert(_.isString(format), 'Expected string format, got ' + format)
  assert.notEqual(['buffer', 'hex', 'base58'].indexOf(format), -1,
    'Expected format in ["buffer", "hex", "base58"], got ' + format)

  var masterKey

  switch (format) {
    case 'buffer':
      masterKey = this.rootHDNode.toBuffer(true)
      break
    case 'hex':
      masterKey = this.rootHDNode.toHex(true)
      break
    case 'base58':
      masterKey = this.rootHDNode.toBase58(true)
      break
  }

  return masterKey
}

/**
 * @param {bitcoinjs-lib.HDNode} rootNode
 * @param {string} path
 * @return {bitcoinjs-lib.HDNode}
 */
function derive(rootNode, path) {
  if (path == 'm' || path == 'M' || path == 'm\'' || path == 'M\'')
    return rootNode

  var node = rootNode
  path.split('/').forEach(function(value, index) {
    if (index === 0) {
      if (value !== 'm')
        throw new Error('invalid path')

      return
    }

    var usePrivate = (value.length > 1) && (value[value.length - 1] === '\'')
    var childIndex = parseInt(usePrivate ? value.slice(0, value.length - 1) : value) & 0x7fffffff

    if (usePrivate)
      childIndex += 0x80000000

    node = node.derive(childIndex)
  })

  return node
}

/**
 * @param {number} index address number in chain
 */
AddressManager.prototype.getAddress = function(index) {
  assert(_.isNumber(index), 'Expected number index, got ' + index)

  // first account, external chain, index address
  var path = "m/0'/0'/" + index

  var node = derive(this.rootHDNode, path)

  return new Address({
    path: path,
    privKey: node.privKey,
    pubKey: node.pubKey,
    network: node.network
  })
}


module.exports = AddressManager
