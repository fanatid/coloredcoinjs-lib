var assert = require('assert')
var _ = require('underscore')

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey
var networks = Object.keys(bitcoin.networks).map(function(key) { return bitcoin.networks[key] })

var blockchain = require('./blockchain')
var ColorData = require('./ColorData')
var colordef = require('./colordef')
var ColorValue = require('./ColorValue')


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

/**
 * Get balance for current address
 *
 * @param {Object} data
 * @param {ColorData} data.colorData
 * @param {BlockchainStateBase} data.blockchain
 * @param {ColorDefinition} data.colorDefinition
 * @param {function} cb Called on finished with params (error, { confirmed: ColorValue, unconfirmed: ColorValue })
 */
Address.prototype.getBalance = function(data, cb) {
  assert(_.isObject(data), 'Expected Object data, got ' + data)
  assert(data.colorData instanceof ColorData,
    'Expected ColorData data.colorData, got ' + data.colorData)
  assert(data.blockchain instanceof blockchain.BlockchainStateBase,
    'Expected BlockchainStateBase data.blockchain, got ' + data.blockchain)
  assert(data.colorDefinition instanceof colordef.ColorDefinition,
    'Expected Array ColorDefinitions, got ' + data.colorDefinition)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)


  data.blockchain.getUTXO(this.getAddress(), function(error, utxo) {
    if (error !== null) {
      cb(error)
      return
    }

    var colorValues = {
      confirmed: new ColorValue({ colordef: data.colorDefinition, value: 0 }),
      unconfirmed: new ColorValue({ colordef: data.colorDefinition, value: 0 })
    }

    getColorValue(colorValues, utxo, 0)
  })

  function getColorValue(colorValues, utxo, index) {
    if (utxo.length === index) {
      cb(null, colorValues)
      return
    }

    var tx = utxo[index]
    data.colorData.getColorValue(tx.txId, tx.outIndex, data.colorDefinition, function(error, colorValue) {
      if (error !== null) {
        cb(error)
        return
      }

      if (colorValue !== null) {
        if (tx.confirmations === 0)
          colorValues.unconfirmed.add(colorValue)
        else
          colorValues.confirmed.add(colorValue)
      }

      getColorValue(colorValues, utxo, index+1)
    })
  }
}

Address.prototype.toString = Address.prototype.getAddress


module.exports = Address
