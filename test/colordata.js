/* global describe, beforeEach, it */
'use strict'

var expect = require('chai').expect
var _ = require('lodash')
var crypto = require('crypto')
var bitcore = require('bitcore')
var Promise = require('bluebird')

var cclib = require('../')
var EPOBC = cclib.definitions.EPOBC

var helpers = require('./helpers')

describe('ColorData', function () {
  var tx1
  var tx2
  var tx3

  var cdefstorage
  var cdmanager
  var cdstorage
  var cdata

  beforeEach(function (done) {
    tx1 = new bitcore.Transaction()
    tx2 = new bitcore.Transaction()
    tx3 = new bitcore.Transaction()

    cdefstorage = new cclib.storage.definitions.Memory()
    cdmanager = new cclib.definitions.Manager(cdefstorage)

    cdstorage = new cclib.storage.data.Memory()
    cdata = new cclib.ColorData(cdstorage, cdmanager)

    Promise.all([cdefstorage.ready, cdstorage.ready])
    .then(_.noop)
    .done(done, done)
  })

  describe('getTxColorValues', function () {
    it('not a color tx', function (done) {
      helpers.tx.addInput(tx1, new Buffer(32), 0, 0xffffffff)
      helpers.tx.addOutput(tx1, _.random(1, 1000))

      cdata.getTxColorValues(tx1, null, EPOBC, helpers.getTxFnStub([]))
        .then(function (result) {
          expect(result).to.be.an('object')
          expect(result.inputs).to.be.an('array').and.to.have.length(0)
          expect(result.outputs).to.be.an('array').and.to.have.length(0)
        })
        .done(done, done)
    })

    it('genesis tx', function (done) {
      helpers.tx.addInput(tx1, new Buffer(32), 0, 37 | (2 << 6))
      helpers.tx.addOutput(tx1, 11)

      cdata.getTxColorValues(tx1, null, EPOBC, helpers.getTxFnStub([]))
        .then(function (result) {
          expect(result).to.be.an('object')
          expect(result.inputs).to.be.an('array').and.to.have.length(0)
          expect(result.outputs).to.be.an('array').and.to.have.length(1)

          var output = result.outputs[0]
          expect(output).to.be.an('object')
          expect(output.cdef).to.be.instanceof(EPOBC)
          expect(output.cdef._genesis.txid).to.equal(tx1.id)
          expect(output.outputs).to.be.an('array').and.to.have.length(1)
          var ocvalue = output.outputs[0]
          expect(ocvalue).to.be.instanceof(cclib.ColorValue)
          expect(ocvalue.getColorDefinition()).to.deep.equal(output.cdef)
          expect(ocvalue.getValue()).to.equal(7)
        })
        .done(done, done)
    })

    it('transfer tx', function (done) {
      helpers.tx.addInput(tx1, new Buffer(32), 0, 37 | (2 << 6))
      helpers.tx.addOutput(tx1, 11)

      helpers.tx.addInput(tx2, tx1.id, 0, 51 | (2 << 6))
      helpers.tx.addOutput(tx2, 10)

      cdata.getTxColorValues(tx2, [0], EPOBC, helpers.getTxFnStub([tx1]))
        .then(function (result) {
          expect(result).to.be.an('object')

          expect(result.inputs).to.be.an('array').and.to.have.length(1)
          var input = result.inputs[0]
          expect(input.cdef).to.be.instanceof(EPOBC)
          expect(input.cdef._genesis.txid).to.equal(tx1.id)
          expect(input.inputs).to.be.an('array').and.to.have.length(1)
          var icvalue = input.inputs[0]
          expect(icvalue).to.be.instanceof(cclib.ColorValue)
          expect(icvalue.getColorDefinition()).to.deep.equal(input.cdef)
          expect(icvalue.getValue()).to.equal(7)

          expect(result.outputs).to.be.an('array').and.to.have.length(1)
          var output = result.outputs[0]
          expect(output.cdef).to.be.instanceof(EPOBC)
          expect(output.cdef._genesis.txid).to.equal(tx1.id)
          expect(output.outputs).to.be.an('array').and.to.have.length(1)
          var ocvalue = output.outputs[0]
          expect(ocvalue).to.be.instanceof(cclib.ColorValue)
          expect(ocvalue.getColorDefinition()).to.deep.equal(output.cdef)
          expect(ocvalue.getValue()).to.equal(6)
        })
        .done(done, done)
    })
  })

  describe('getOutputColorValue', function () {
    it('tranfer tx from 2 genesis tx', function (done) {
      helpers.tx.addInput(tx1, new Buffer(32), 0, 37 | (3 << 6))
      helpers.tx.addOutput(tx1, 18)

      helpers.tx.addInput(tx2, new Buffer(32), 0, 37 | (3 << 6))
      helpers.tx.addOutput(tx2, 28)

      helpers.tx.addInput(tx3, tx1.id, 0, 51 | (3 << 6))
      helpers.tx.addInput(tx3, tx2.id, 0, 0)
      helpers.tx.addOutput(tx3, 13)
      helpers.tx.addOutput(tx3, 15)
      helpers.tx.addOutput(tx3, 18)

      var getTxFn = helpers.getTxFnStub([tx1, tx2])

      cdata.getOutputColorValue(tx3, 0, EPOBC, getTxFn)
        .then(function (result) {
          expect(result).to.be.an('array').and.to.have.length(1)
          var cv = result[0]
          expect(cv).to.be.instanceof(cclib.ColorValue)
          expect(cv.getColorDefinition()._genesis.txid).to.equal(tx1.id)
          expect(cv.getValue()).to.equal(5)
          return cdata.getOutputColorValue(tx3, 1, EPOBC, getTxFn)
        })
        .then(function (result) {
          expect(result).to.be.an('array').and.to.have.length(0)
          return cdata.getOutputColorValue(tx3, 2, EPOBC, getTxFn)
        })
        .then(function (result) {
          expect(result).to.be.an('array').and.to.have.length(1)
          var cv = result[0]
          expect(cv).to.be.instanceof(cclib.ColorValue)
          expect(cv.getColorDefinition()._genesis.txid).to.equal(tx2.id)
          expect(cv.getValue()).to.equal(10)
        })
        .done(done, done)
    })
  })

  it('remove color values', function (done) {
    var data = {
      colorCode: EPOBC.getColorCode(),
      txid: crypto.pseudoRandomBytes(32).toString('hex'),
      oidx: 0,
      colorId: 1,
      value: 10
    }

    cdstorage.add(data)
      .then(function (cvalue) {
        return cdata.removeColorValues(data.txid, EPOBC)
      })
      .then(function () {
        return cdstorage.get(data)
      })
      .then(function (data) {
        expect(data).to.deep.equal({})
      })
      .done(done, done)
  })
})
