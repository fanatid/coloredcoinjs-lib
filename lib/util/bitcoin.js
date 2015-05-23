var _ = require('lodash')
var bitcore = require('bitcore')
var Script = bitcore.Script
var Address = bitcore.Address

/**
 * @param {string} rawScript
 * @param {string|Object} network
 * @return {bitcore.Address}
 */
module.exports.script2addresses = function (rawScript, network) {
  var script = new Script(rawScript)
  var addresses = []

  if (script.isPublicKeyHashOut()) {
    addresses.push(
      new Address(script.chunks[2].buf, network, Address.PayToPublicKeyHash))
  }

  if (script.isPublicKeyOut()) {
    var pk = bitcore.PublicKey(script.chunks[0].buf)
    addresses.push(
      new Address(pk, network, Address.PayToPublicKeyHash))
  }

  if (script.isMultisigOut()) {
    script.chunks.slice(1, -2).forEach(function (chunk) {
      var pk = bitcore.PublicKey(chunk.buf)
      addresses.push(
        new Address(pk, network, Address.PayToPublicKeyHash))
    })
  }

  if (script.isScriptHashOut()) {
    addresses.push(
      new Address(script.chunks[1].buf, network, Address.PayToScriptHash))
  }

  return _.invoke(addresses, 'toString')
}
