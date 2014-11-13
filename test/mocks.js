var cclib = require('../src/index')
var Transaction = cclib.bitcoin.Transaction
var verify = cclib.verify


/**
 * Mock for transaction.Transaction
 *
 * @param {string} txId
 * @param {number[]} inputs
 * @param {number[]} outputs
 * @param {number[]} inputSequenceIndices
 * @return {transaction.Transaction}
 */
function createTx(txId, inputs, outputs, inputSequenceIndices) {
  verify.txId(txId)
  verify.array(inputs)
  inputs.forEach(verify.number)
  verify.array(outputs)
  outputs.forEach(verify.number)
  verify.array(inputSequenceIndices)
  inputSequenceIndices.forEach(verify.number)

  var tx = new Transaction()

  tx.ensured = true
  tx.getId = function () { return txId }

  inputs.forEach(function (satoshis) {
    var index = tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 1)
    tx.ins[index].value = satoshis
    tx.ins[index].prevTx = createTx(
      '00ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', [], [], [0, 1, 4, 5, 6, 7])
  })

  if (tx.ins.length === 0) {
    tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 1, 0)
  }

  tx.ins[0].sequence = inputSequenceIndices.reduce(
    function (x, i) { return x + Math.pow(2, i) }, 0)

  outputs.forEach(function (satoshis) {
    tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', satoshis)
  })

  return tx
}


module.exports = {
  createTx: createTx
}
