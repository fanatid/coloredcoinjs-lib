var assert = require('assert')

var _ = require('underscore')

var AddressManager = require('./AddressManager')
var blockchain = require('./blockchain')
var Coin = require('./Coin')
var CoinList = require('./CoinList')
var ColorData = require('./ColorData')
var ColorDefinitionManager = require('./ColorDefinitionManager')
var store = require('./store')


/**
 * @class Wallet
 *
 * @param {ConfigStore} config
 */
function Wallet(config) {
  assert(config instanceof store.ConfigStore, 'Expected ConfigStore config, got ' + config)

  this.blockchain = new blockchain.BlockrIOAPI({ testnet: config.get('testnet', false) })

  this.aStore = new store.AddressStore()
  // Todo: check master key network... to equal config.testnet ?
  this.aManager = new AddressManager(this.aStore)

  this.cDataStore = new store.ColorDataStore()
  this.cData = new ColorData({ cdStore: this.cDataStore, blockchain: this.blockchain })

  this.cDefinitionStore = new store.ColorDefinitionStore()
  this.cDefinitionManager = new ColorDefinitionManager(this.cDefinitionStore)
}

/**
 * Get all addresses
 *
 * @return {Array}
 */
Wallet.prototype.getAllAddresses = function() {
  return this.aManager.getAllAddresses()
}

/**
 *
 * @param {function} cb
 */
Wallet.prototype.getUnspent = function(cb) {
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this
  var utxo = []
  var addresses = this.getAllAddresses()

  function getUTXO(index) {
    if (addresses.length === index) {
      var coins = utxo.map(function(tx) {
        return new Coin({
          colorDefinitionManager: _this.cDefinitionManager,
          colorData: _this.cData,
          txId: tx.txId,
          outIndex: tx.outIndex,
          value: tx.value,
          confirmations: tx.confirmations
        })
      })

      process.nextTick(function() { cb(null, new CoinList(coins)) })
      return
    }

    _this.blockchain.getUTXO(addresses[index].getAddress(), function(error, result) {
      if (error !== null) {
        cb(error)
        return
      }

      utxo = utxo.concat(result)
      getUTXO(index+1)
    })
  }

  getUTXO(0)
}


module.exports = Wallet
