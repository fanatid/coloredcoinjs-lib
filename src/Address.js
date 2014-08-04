var assert = require('assert')
var _ = require('lodash')

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey
var networks = Object.keys(bitcoin.networks).map(function(key) { return bitcoin.networks[key] })


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


module.exports = Address
