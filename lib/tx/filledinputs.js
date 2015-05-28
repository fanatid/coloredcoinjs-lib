/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)
var bitcore = require('bitcore')
var Transaction = bitcore.Transaction

var bitcoinUtil = require('../util/bitcoin')

/**
 * @callback getTxFn~callback
 * @param {Error} err
 * @param {string} rawTx
 */

/**
 * @callback getTxFn
 * @param {string} txid
 * @param {getTxFn~callback} callback
 */

/**
 * @class FilledInputsTx
 * @param {bitcore.Transaction} tx
 * @param {getTxFn} getTxFn
 */
function FilledInputsTx (tx, getTxFn) {
  var self = this
  Promise.try(function () {
    self._tx = Transaction.shallowCopy(tx)
    self._prevTxs = []
    self._prevValues = []

    var getTx = Promise.promisify(getTxFn)
    return Promise.map(self._tx.inputs, function (input, index) {
      var inputTxId = input.prevTxId.toString('hex')

      var isCoinbase = index === 0 &&
                       input.outputIndex === 4294967295 &&
                       inputTxId === bitcoinUtil.zeroHash
      if (isCoinbase) {
        self._prevTxs[index] = null
        self._prevValues[index] = 0
        return
      }

      return getTx(inputTxId)
        .then(function (rawtx) {
          var tx = new Transaction(rawtx)
          self._prevTxs[index] = tx
          self._prevValues[index] = tx.outputs[input.outputIndex].satoshis
        })
    })
  })
  .done(function () { self._ready() },
        function (err) { self._ready(err) })
}

readyMixin(FilledInputsTx.prototype)

/**
 * @return {bitcore.Transaction}
 */
FilledInputsTx.prototype.getTx = function () {
  return Transaction.shallowCopy(this._tx)
}

/**
 * @param {number} index
 * @return {Promise.<?bitcore.Transaction>}
 */
FilledInputsTx.prototype.getInputTx = function (index) {
  var self = this
  return self.ready
    .then(function () {
      var tx = self._prevTxs[index]
      if (tx !== null) {
        tx = Transaction.shallowCopy(tx)
      }

      return tx
    })
}

/**
 * @param {number} index
 * @return {Promise.<number>}
 */
FilledInputsTx.prototype.getInputValue = function (index) {
  var self = this
  return self.ready
    .then(function () {
      return self._prevValues[index]
    })
}

module.exports = FilledInputsTx
