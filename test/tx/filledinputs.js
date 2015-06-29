/* globals describe, beforeEach, it */
'use strict'

var expect = require('chai').expect
var bitcore = require('bitcore')

var cclib = require('../../')

var getTxFn = require('../helpers').getTxFn
var transactions = require('../fixtures/transactions.json')

describe('tx.FilledInputs', function () {
  var fitx

  describe('isCoinbase', function () {
    var txid = '548be1cc68780cbe0ce7e4b46c06dbe38ecd509a3f448e5ca68cc294679c27b1'
    var rawtx = transactions[txid]

    beforeEach(function (done) {
      fitx = new cclib.tx.FilledInputs(rawtx, getTxFn)
      fitx.ready.done(done, done)
    })

    it('getTx', function () {
      expect(fitx.getTx().id).to.equal(txid)
    })

    it('getInputTx', function (done) {
      fitx.getInputTx(0)
        .then(function (inputTx) {
          expect(inputTx).to.be.null
        })
        .done(done, done)
    })

    it('getInputValue', function (done) {
      fitx.getInputValue(0)
        .then(function (inputValue) {
          expect(inputValue).to.equal(0)
        })
        .done(done, done)
    })
  })

  describe('!isCoinbase', function () {
    var txid = '27eba159ab0c50c3d2d1abad6ce83f501b34121fa96d7aa91fad2c3cfec68366'
    var tx = bitcore.Transaction(transactions[txid])

    beforeEach(function (done) {
      fitx = new cclib.tx.FilledInputs(tx, getTxFn)
      fitx.ready.done(done, done)
    })

    it('getTx', function () {
      expect(fitx.getTx().id).to.equal(txid)
    })

    it('getInputTx', function (done) {
      fitx.getInputTx(0)
        .then(function (inputTx) {
          expect(inputTx.id).to.equal(tx.inputs[0].prevTxId.toString('hex'))
        })
        .done(done, done)
    })

    it('getInputValue', function (done) {
      fitx.getInputValue(0)
        .then(function (inputValue) {
          expect(inputValue).to.equal(30838652979)
        })
        .done(done, done)
    })
  })
})
