var _ = require('lodash')
var Q = require('q')

var bitcoin = require('bitcoinjs-lib')

var verify = require('./verify')


/**
 * @external bitcoinjs-lib
 * @see {@link https://github.com/bitcoinjs/bitcoinjs-lib/ BitcoinJS library}
 */

/**
 * @member {function} external:bitcoinjs-lib.Script
 */

/**
 * @member {function} external:bitcoinjs-lib.Transaction
 */

bitcoin.util = {}

/**
 * Extract addresses from script
 *
 * @param {external:bitcoinjs-lib.Script} script Source script
 * @param {Object} network Bitcoin network (one of bitcoin.networks)
 * @param {number} network.pubKeyHash
 * @param {number} network.scriptHash
 * @return {string[]}
 */
bitcoin.util.getAddressesFromScript = function (script, network) {
  var addresses = []

  switch (bitcoin.scripts.classifyOutput(script)) {
    case 'pubkeyhash':
      addresses = [new bitcoin.Address(script.chunks[2], network.pubKeyHash)]
      break

    case 'pubkey':
      addresses = [bitcoin.ECPubKey.fromBuffer(script.chunks[0]).getAddress(network)]
      break

    case 'multisig':
      addresses = script.chunks.slice(1, -2).map(function (pubKey) {
        return bitcoin.ECPubKey.fromBuffer(pubKey).getAddress(network)
      })
      break

    case 'scripthash':
      addresses = [new bitcoin.Address(script.chunks[1], network.scriptHash)]
      break

    default:
      break
  }

  return addresses.map(function (addr) { return addr.toBase58Check() })
}

bitcoin.getAddressesFromOutputScript = function () {
  console.warn('bitcoin.getAddressesFromOutputScript deprecated for removal ' +
               'in v1.0.0, use bitcoin.util.getAddressesFromScript')

  return bitcoin.util.getAddressesFromScript.apply(this, Array.prototype.slice.call(arguments))
}

/**
 * Reverse buffer and transform to hex string
 *
 * @param {Buffer} s
 * @return {string}
 */
bitcoin.util.hashEncode = function (s) {
  return Array.prototype.reverse.call(new Buffer(s)).toString('hex')
}

/**
 * Transform hex string to buffer and reverse it
 *
 * @param {string} s
 * @return {Buffer}
 */
bitcoin.util.hashDecode = function (s) {
  return Array.prototype.reverse.call(new Buffer(s, 'hex'))
}


var transactionClone = bitcoin.Transaction.prototype.clone

/**
 * @return {external:bitcoinjs-lib.Transaction}
 */
bitcoin.Transaction.prototype.clone = function () {
  var self = this

  var tx = transactionClone.apply(self, Array.prototype.slice.call(arguments))

  if (!_.isUndefined(self.ensured)) {
    tx.ensured = self.ensured
  }

  tx.ins = tx.ins.map(function (input, index) {
    if (!_.isUndefined(self.ins[index].value)) {
      input.value = self.ins[index].value
    }

    if (!_.isUndefined(self.ins[index].prevTx)) {
      input.prevTx = self.ins[index].prevTx
    }

    return input
  })

  return tx
}

/** @constant {string} */
var ZeroHash = _.range(64).map(function () { return 0 }).join('')

/**
 * Check input as coinbase
 *
 * @param {object} input One of the inputs of the transaction
 * @param {Buffer} input.hash
 * @param {number} input.index
 * @return {boolean}
 */
function isCoinbase(input) {
  return input.hash.toString('hex') === ZeroHash && input.index === 4294967295
}

/**
 * @callback Transaction~ensureInputValuesCallback
 * @param {?Error} error
 * @param {external:bitcoinjs-lib.Transaction} tx
 */

/**
 * Get transactions for all inputs and return new transaction
 *    with prevTx and value filds in inputs
 *
 * @param {getTxFn} getTxFn
 * @param {Transaction~ensureInputValuesCallback} cb
 */
bitcoin.Transaction.prototype.ensureInputValues = function (getTxFn, cb) {
  verify.function(getTxFn)
  verify.function(cb)

  var tx = this.clone()

  Q.fcall(function () {
    if (tx.ensured === true) {
      return tx
    }

    var promises = tx.ins.map(function (input) {
      if (isCoinbase(input)) {
        input.prevTx = null
        input.value = 0
        return
      }

      var txId = bitcoin.util.hashEncode(input.hash)
      return Q.nfcall(getTxFn, txId).then(function (prevTx) {
        input.prevTx = prevTx
        input.value = prevTx.outs[input.index].value
      })
    })

    return Q.all(promises).then(function () {
      tx.ensured = true
    })

  }).done(function () { cb(null, tx) }, function (error) { cb(error) })
}


module.exports = bitcoin
