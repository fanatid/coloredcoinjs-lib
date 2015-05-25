/* global describe, beforeEach, it */
var _ = require('lodash')
var expect = require('chai').expect
var bitcore = require('bitcore')

var cclib = require('../../')
var EPOBC = cclib.definitions.EPOBC

var helpers = require('../helpers')
var fixtures = require('../fixtures/definitions.json').epobc

describe('definitions.EPOBC._Tag', function () {
  var Tag = EPOBC._Tag

  it('_number2bitArray', function () {
    var bits = Tag._number2bitArray(54648432)
    expect(bits).to.deep.equal(
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0])
  })

  it('_number2bitArray (specific bits)', function () {
    var bits = Tag._number2bitArray(51, 6)
    expect(bits).to.deep.equal([1, 1, 0, 0, 1, 1])
  })

  it('_bitArray2number', function () {
    var bits = [1, 1, 0, 0, 1, 1]
    expect(Tag._bitArray2number(bits)).to.equal(51)
  })

  it('closestPaddingCode for zero padding', function () {
    var result = Tag.closestPaddingCode(0)
    expect(result).to.equal(0)
  })

  it('closestPaddingCode more than max padding', function () {
    var fn = function () { Tag.closestPaddingCode(Math.pow(2, 64)) }
    expect(fn).to.throw(Error)
  })

  it('closestPaddingCode', function () {
    var result = Tag.closestPaddingCode(7)
    expect(result).to.equal(3)
  })

  it('fromTx for coinbase tx', function () {
    var tx = {
      inputs: [{
        prevTxId: new Buffer(cclib.util.bitcoin.zeroHash, 'hex'),
        outputIndex: 4294967295
      }]
    }
    var tag = Tag.fromTx(tx)
    expect(tag).to.be.null
  })

  it('fromTx for not xfer and not genesis tx', function () {
    var tx = {
      inputs: [{
        prevTxId: new Buffer(32),
        outputIndex: 0,
        sequenceNumber: 4294967295
      }]
    }
    var tag = Tag.fromTx(tx)
    expect(tag).to.be.null
  })

  it('fromTx', function () {
    var tx = {
      inputs: [{
        prevTxId: new Buffer(32),
        outputIndex: 0,
        sequenceNumber: 37 | (1 << 6)
      }]
    }
    var tag = Tag.fromTx(tx)
    expect(tag).to.be.instanceof(Tag)
    expect(tag.isGenesis()).to.equal(true)
    expect(tag.getPadding()).to.equal(2)
  })

  it('toSequence for genesis tag', function () {
    var tag = new Tag(10, true)
    expect(tag.toSequence()).to.equal(677)
  })

  it('toSequence for xfer tag', function () {
    var tag = new Tag(10, false)
    expect(tag.toSequence()).to.equal(691)
  })

  it('getPadding #1', function () {
    var tag = new Tag(0, true)
    expect(tag.getPadding()).to.equal(0)
  })

  it('getPadding #2', function () {
    var tag = new Tag(2, true)
    expect(tag.getPadding()).to.equal(4)
  })
})

describe('definitions.EPOBC', function () {
  var genesis = {
    txid: new Buffer(32).toString('hex'),
    vout: _.random(0, 10),
    height: _.random(100000, 400000)
  }
  var epobc

  beforeEach(function () {
    epobc = new EPOBC(1, genesis)
  })

  it('inherits IColorDefinition', function () {
    expect(epobc).to.be.instanceof(EPOBC)
    expect(epobc).to.be.instanceof(cclib.definitions.Interface)
  })

  describe('fromDesc', function () {
    it('throw error', function () {
      function fn () { EPOBC.fromDesc(1, 'obc:11:2:3') }
      expect(fn).to.throw(Error)
    })

    it('return EPOBCColorDefinition', function () {
      var epobc2 = EPOBC.fromDesc(epobc.getColorId(), epobc.getDesc())
      expect(epobc2).to.deep.equal(epobc)
    })
  })

  describe('getDesc', function () {
    it('#1', function () {
      var items = [genesis.txid, genesis.vout, genesis.height]
      expect(epobc.getDesc()).to.equal('epobc:' + items.join(':'))
    })
  })

  describe('_getXferAffectingInputs', function () {
/*
    var affectingInputs

    it.skip('valueWop equal 0 for tx.outs', function () {
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 1)
      expect(affectingInputs).to.deep.equal([])
    })

    it.skip('outValueWop equal 0 for tx.outs', function () {
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 1)
      expect(affectingInputs).to.deep.equal([])
    })

    it.skip('prevTag is null', function () {
      tx2.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      tx1.addInput(tx2.getId(), 0, 4294967295)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.ins[0].prevTx = tx2
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 0)
      expect(affectingInputs).to.deep.equal([])
    })

    it.skip('valueWop equal 0 for tx.ins[0].value', function () {
      tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
      tx1.addInput(tx2.getId(), 0, 4294967295)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.ins[0].prevTx = tx2
      tx1.ins[0].value = 0
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 0)
      expect(affectingInputs).to.deep.equal([])
    })

    it.skip('isAffectingInput is true', function () {
      tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
      tx1.addInput(tx2.getId(), 0, 4294967295)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.ins[0].prevTx = tx2
      tx1.ins[0].value = 2
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 0)
      expect(affectingInputs).to.deep.equal([0])
    })

    it.skip('isAffectingInput is false', function () {
      tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
      tx1.addInput(tx2.getId(), 0, 4294967295)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.ins[0].prevTx = tx2
      tx1.ins[0].value = 1
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 1)
      expect(affectingInputs).to.deep.equal([])
    })
*/
  })

  describe('runKernel', function () {
    fixtures.runKernel.forEach(function (f) {
      it(f.description, function (done) {
        if (f.description.indexOf('genesis') !== -1) {
          epobc._genesis.txid = f.txid
        }

        var env = helpers.createRunKernelEnv(
          f.txid, f.inputs, f.outputs, f.sequence)

        var inColorValues = f.inColorValues.map(function (cv) {
          if (cv !== null) {
            cv = new cclib.ColorValue(epobc, cv)
          }

          return cv
        })

        epobc.runKernel(env.top, inColorValues, helpers.getTxFnStub(env.deps))
          .then(function (result) {
            expect(result).to.be.instanceof(Array)

            result = result.map(function (value) {
              if (value !== null) {
                value = value.getValue()
              }

              return value
            })

            expect(result).to.deep.equal(f.expect)
          })
          .done(done, done)
      })
    })
  })

  describe('getAffectingInputs', function () {
    it('tag is null', function (done) {
      var tx = {
        inputs: [{
          prevTxId: new Buffer(cclib.util.bitcoin.zeroHash, 'hex'),
          sequenceNumber: 4294967295
        }]
      }
      EPOBC.getAffectingInputs(tx, [], helpers.getTxFnStub([]))
        .then(function (inputs) {
          expect(inputs).to.deep.equal([])
        })
        .done(done, done)
    })

    it('genesis tag', function (done) {
      var tx = {
        inputs: [{
          prevTxId: new Buffer(32),
          sequenceNumber: 37
        }]
      }
      EPOBC.getAffectingInputs(tx, [], helpers.getTxFnStub([]))
        .then(function (inputs) {
          expect(inputs).to.deep.equal([])
        })
        .done(done, done)
    })

    it('return affecting index', function (done) {
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

      EPOBC.getAffectingInputs(tx2, [0], helpers.getTxFnStub([tx1]))
        .then(function (indices) {
          expect(indices).to.deep.equal([0])
        })
        .done(done, done)
    })
  })
})
