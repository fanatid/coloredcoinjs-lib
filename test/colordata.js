/* global describe, beforeEach, afterEach, it */
var expect = require('chai').expect
var _ = require('lodash')
var bitcore = require('bitcore')

var cclib = require('../')

var helpers = require('./helpers')

describe('ColorData', function () {
  var cdStorage
  var epobc
  var cdata

  beforeEach(function (done) {
    cdStorage = new cclib.storage.data.Memory()
    cdStorage.ready.done(done, done)
    epobc = new cclib.definitions.EPOBC(1, {
      txid: bitcore.crypto.Random.getRandomBuffer(32).toString('hex'),
      vout: 0,
      height: 0
    })
    cdata = new cclib.ColorData(cdStorage)
  })

  afterEach(function (done) {
    cdStorage.clear().done(done, done)
  })

  describe('_getColorValue', function () {
    var txid = bitcore.crypto.Random.getRandomBuffer(32).toString('hex')

    it('return null', function (done) {
      cdata._getColorValue(txid, 0, epobc)
        .then(function (cvalue) {
          expect(cvalue).to.be.null
        })
        .done(done, done)
    })

    it('return ColorValue instance', function (done) {
      var data = {txid: txid, vout: 0, colorId: epobc.getColorId(), value: 10}
      cdStorage.add(data)
        .then(function () {
          return cdata._getColorValue(txid, 0, epobc)
        })
        .then(function (cvalue) {
          expect(cvalue).to.be.instanceof(cclib.ColorValue)
          expect(cvalue.getValue()).to.equal(10)
        })
        .done(done, done)
    })
  })

  describe('getTxColorValues', function () {
    it('not a color tx', function (done) {
      var tx = new bitcore.Transaction()
      tx.uncheckedAddInput(bitcore.Transaction.Input({
        prevTxId: new Buffer(32),
        outputIndex: 0,
        script: bitcore.Script.fromAddress(helpers.getRandomAddress())
      }))
      tx.addOutput(bitcore.Transaction.Output({
        satoshis: _.random(1, 1000),
        script: bitcore.Script.buildPublicKeyHashOut(helpers.getRandomAddress())
      }))

      cdata.getTxColorValues(tx, null, epobc, helpers.getTxFnStub([]))
        .then(function (result) {
          expect(result).to.deep.equal({inputs: [null], outputs: [null]})
        })
        .done(done, done)
    })

    it('genesis tx', function (done) {
      var tx = new bitcore.Transaction()
      tx._getHash = function () {
        var hash = new Buffer(epobc._genesis.txid, 'hex')
        return Array.prototype.reverse.call(hash)
      }
      tx.uncheckedAddInput(bitcore.Transaction.Input({
        prevTxId: new Buffer(32),
        outputIndex: 0,
        sequenceNumber: 37 | (2 << 6),
        script: bitcore.Script.fromAddress(helpers.getRandomAddress())
      }))
      tx.addOutput(bitcore.Transaction.Output({
        satoshis: 11,
        script: bitcore.Script.buildPublicKeyHashOut(helpers.getRandomAddress())
      }))

      cdata.getTxColorValues(tx, null, epobc, helpers.getTxFnStub([]))
        .then(function (result) {
          var ovalue = new cclib.ColorValue(epobc, 7)
          expect(result).to.deep.equal({inputs: [null], outputs: [ovalue]})
        })
        .done(done, done)
    })

    it('transfer tx', function (done) {
      var tx1 = new bitcore.Transaction()
      tx1.uncheckedAddInput(bitcore.Transaction.Input({
        prevTxId: new Buffer(32),
        outputIndex: 0,
        sequenceNumber: 37 | (2 << 6),
        script: bitcore.Script.fromAddress(helpers.getRandomAddress())
      }))
      tx1.addOutput(bitcore.Transaction.Output({
        satoshis: 11,
        script: bitcore.Script.buildPublicKeyHashOut(helpers.getRandomAddress())
      }))
      epobc._genesis.txid = tx1.id

      var tx2 = new bitcore.Transaction()
      tx2.uncheckedAddInput(bitcore.Transaction.Input({
        prevTxId: tx1.id,
        outputIndex: 0,
        sequenceNumber: 51 | (2 << 6),
        script: bitcore.Script.fromAddress(helpers.getRandomAddress())
      }))
      tx2.addOutput(bitcore.Transaction.Output({
        satoshis: 10,
        script: bitcore.Script.buildPublicKeyHashOut(helpers.getRandomAddress())
      }))

      cdata.getTxColorValues(tx2, [0], epobc, helpers.getTxFnStub([tx1]))
        .then(function (result) {
          var incval = new cclib.ColorValue(epobc, 7)
          var outcval = new cclib.ColorValue(epobc, 6)
          expect(result).to.deep.equal({inputs: [incval], outputs: [outcval]})
        })
        .done(done, done)
    })
  })

  describe('getOutputColorValue', function () {
    it('transfer tx', function (done) {
      var tx1 = new bitcore.Transaction()
      tx1.uncheckedAddInput(bitcore.Transaction.Input({
        prevTxId: new Buffer(32),
        outputIndex: 0,
        sequenceNumber: 37 | (2 << 6),
        script: bitcore.Script.fromAddress(helpers.getRandomAddress())
      }))
      tx1.addOutput(bitcore.Transaction.Output({
        satoshis: 11,
        script: bitcore.Script.buildPublicKeyHashOut(helpers.getRandomAddress())
      }))
      epobc._genesis.txid = tx1.id

      var tx2 = new bitcore.Transaction()
      tx2.uncheckedAddInput(bitcore.Transaction.Input({
        prevTxId: tx1.id,
        outputIndex: 0,
        sequenceNumber: 51 | (2 << 6),
        script: bitcore.Script.fromAddress(helpers.getRandomAddress())
      }))
      tx2.addOutput(bitcore.Transaction.Output({
        satoshis: 10,
        script: bitcore.Script.buildPublicKeyHashOut(helpers.getRandomAddress())
      }))

      cdata.getOutputColorValue(tx2, 0, epobc, helpers.getTxFnStub([tx1]))
        .then(function (cvalue) {
          expect(cvalue).to.be.instanceof(cclib.ColorValue)
          expect(cvalue.getValue()).to.be.equal(6)
        })
        .done(done, done)
    })
  })

  it('remove color values', function (done) {
    var txid = bitcore.crypto.Random.getRandomBuffer(32).toString('hex')
    var data = {txid: txid, vout: 0, colorId: epobc.getColorId(), value: 10}
    cdStorage.add(data)
      .then(function () {
        return cdata._getColorValue(txid, 0, epobc)
      })
      .then(function (cvalue) {
        expect(cvalue).to.be.instanceof(cclib.ColorValue)
        expect(cvalue.getValue()).to.equal(10)
        return cdata.removeColorValues(txid, 0)
      })
      .then(function () {
        return cdata._getColorValue(txid, 0, epobc)
      })
      .then(function (cvalue) {
        expect(cvalue).to.be.null
      })
      .done(done, done)
  })
})
