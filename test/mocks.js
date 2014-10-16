var assert = require('assert')
var _ = require('lodash')

var cclib = require('../src/index')
var Transaction = cclib.bitcoin.Transaction


/**
 * Mock for transaction.Transaction
 *
 * @param {string} txId
 * @param {Array} inputs
 * @param {Array} outputs
 * @param {Array} inputSequenceIndices
 * @return {transaction.Transaction}
 */
function createTx(txId, inputs, outputs, inputSequenceIndices) {
  assert(Transaction.isTxId(txId), 'Expected transaction id txId, got ' + txId)
  assert(_.isArray(inputs), 'Expected inputs Array, got ' + inputs)
  assert(inputs.every(function(x) { return _.isNumber(x)}),
    'Expected inputs Array of numbers, got ' + inputs)
  assert(_.isArray(outputs), 'Expected outputs Array, got ' + outputs)
  assert(outputs.every(function(x) { return _.isNumber(x)}),
    'Expected outputs Array of numbers, got ' + outputs)
  assert(_.isArray(inputSequenceIndices), 'Expected inputSequenceIndices Array, got ' + inputSequenceIndices)
  assert(inputSequenceIndices.every(function(x) { return _.isNumber(x)}),
    'Expected inputSequenceIndices Array of numbers, got ' + inputSequenceIndices)

  var tx = new Transaction()

  tx.ensured = true
  tx.getId = function() { return txId }

  inputs.forEach(function(satoshis) {
    var index = tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 1)
    tx.ins[index].value = satoshis
    tx.ins[index].prevTx = createTx('00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', [], [], [0,1,4,5,6,7])
  })

  if (tx.ins.length === 0)
    tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 1, 0)

  tx.ins[0].sequence = inputSequenceIndices.reduce(
    function(x, i) { return x + Math.pow(2, i) }, 0)

  outputs.forEach(function(satoshis) {
    tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', satoshis)
  })

  return tx
}


module.exports = {
  createTx: createTx
}
