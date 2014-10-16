var _ = require('lodash')
var Q = require('q')

var bitcoin = require('bitcoinjs-lib')


/**
 * @param {bitcoinjs-lib.Script} script
 * @param {Object} network
 * @param {number} network.pubKeyHash
 * @param {number} network.scriptHash
 * @return {string[]}
 */
bitcoin.getAddressesFromOutputScript = function(script, network) {
  var addresses = []

  switch (bitcoin.scripts.classifyOutput(script)) {
    case 'pubkeyhash':
      addresses = [new bitcoin.Address(script.chunks[2], network.pubKeyHash)]
      break

    case 'pubkey':
      addresses = [bitcoin.ECPubKey.fromBuffer(script.chunks[0]).getAddress(network)]
      break

    case 'multisig':
      addresses = script.chunks.slice(1, -2).map(function(pubKey) {
        return bitcoin.ECPubKey.fromBuffer(pubKey).getAddress(network)
      })
      break

    case 'scripthash':
      addresses = [new bitcoin.Address(script.chunks[1], network.scriptHash)]
      break

    default:
      break
  }

  return addresses.map(function(addr) { return addr.toBase58Check() })
}


/**
 * Check txId is 32 bytes hex string
 *
 * @param {string} txId
 * @return {boolean}
 */
bitcoin.Transaction.isTxId = function(txId) {
  var set = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']

  return (_.isString(txId) &&
          txId.length === 64 &&
          txId.toLowerCase().split('').every(function(x) { return set.indexOf(x) !== -1 }))
}

var transactionClone = bitcoin.Transaction.prototype.clone
/**
 * @return {bitcoinjs-lib.Transaction}
 */
bitcoin.Transaction.prototype.clone = function() {
  var self = this

  var tx = transactionClone.apply(self, Array.prototype.slice.call(arguments))

  if (!_.isUndefined(self.ensured))
    tx.ensured = self.ensured

  tx.ins = tx.ins.map(function(input, index) {
    if (!_.isUndefined(self.ins[index].value))
      input.value = self.ins[index].value

    if (!_.isUndefined(self.ins[index].prevTx))
      input.prevTx = self.ins[index].prevTx

    return input
  })

  return tx
}

/**
 * @callback Transaction~ensureInputValues
 * @param {?Error} error
 * @param {bitcoinjs-lib.Transaction} tx
 */

/**
 * Get previous transaction for all inputs and
 *  return new transaction via callback cb
 *
 * @param {function} getTxFn
 * @param {Transaction~ensureInputValues} cb
 */
bitcoin.Transaction.prototype.ensureInputValues = function(getTxFn, cb) {
  var tx = this.clone()

  Q.fcall(function() {
    if (tx.ensured === true)
      return tx

    var promises = tx.ins.map(function(input) {
      var isCoinbase = (
        input.hash.toString('hex') === '0000000000000000000000000000000000000000000000000000000000000000' &&
        input.index === 4294967295)

      if (isCoinbase) {
        input.value = 0
        return
      }

      var txId = Array.prototype.reverse.call(new Buffer(input.hash)).toString('hex')
      return Q.nfcall(getTxFn, txId).then(function(prevTx) {
        input.prevTx = prevTx
        input.value = prevTx.outs[input.index].value
      })
    })

    return Q.all(promises).then(function() { tx.ensured = true })

  }).done(function() { cb(null, tx) }, function(error) { cb(error) })
}


module.exports = bitcoin
