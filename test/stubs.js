var inherits = require('util').inherits

var _ = require('lodash')

var cclib = require('../')
var getUncolored = cclib.ColorDefinitionManager.getUncolored
var ColorValue = cclib.ColorValue

/**
 * Stub for testing fee related method
 *
 * @class FeeOperationalTx
 * @extends OperationalTx
 * @param {number} feeSize
 */
function FeeOperationalTx (feeSize) {
  cclib.OperationalTx.call(this)
  this.feeSize = new ColorValue(getUncolored(), feeSize)
}

inherits(FeeOperationalTx, cclib.OperationalTx)

FeeOperationalTx.prototype.getRequiredFee = function () {
  return this.feeSize
}

/**
 * Stub for blockchain.BlockchainStateBase.getTx
 *
 * @param {bitcoinjs-lib.Transaction[]} transactions
 * @return {function}
 */
function getTxStub (transactions) {
  var txMap = _.zipObject(transactions.map(function (tx) {
    return [tx.getId(), tx.clone()]
  }))

  return function getTx (txId, cb) {
    if (_.isUndefined(txMap[txId])) {
      return cb(new Error('notFoundTx'))
    }

    cb(null, txMap[txId].toHex())
  }
}

module.exports = {
  FeeOperationalTx: FeeOperationalTx,
  getTxStub: getTxStub
}
