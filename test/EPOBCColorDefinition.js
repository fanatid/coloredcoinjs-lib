var expect = require('chai').expect

var cclib = require('../src/index')
var EPOBCColorDefinition = cclib.EPOBCColorDefinition
var mocks = require('./mocks')
var stubs = require('./stubs')

var fixtures = require('./fixtures/color.EPOBCColorDefinition')


describe('EPOBCColorDefinition', function() {
  var epobc
  var tx1, tx2

  beforeEach(function() {
    epobc = new EPOBCColorDefinition({ colorId: 1 },
      { txId: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', outIndex: 0, height: 0 })
    tx1 = new cclib.bitcoin.Transaction()
    tx2 = new cclib.bitcoin.Transaction()
  })

  it('inherits ColorDefinition', function() {
    expect(epobc).to.be.instanceof(cclib.ColorDefinition)
    expect(epobc).to.be.instanceof(EPOBCColorDefinition)
  })

  describe('fromDesc', function() {
    it('throw error', function(){
      function fn() { EPOBCColorDefinition.fromDesc(1, 'obc:11:2:3') }
      expect(fn).to.throw(Error)
    })

    it('create new EPOBCColorDefinition', function() {
      var epobc2 = EPOBCColorDefinition.fromDesc(epobc.getColorId(), epobc.getDesc())
      expect(epobc2).to.deep.equal(epobc)
    })
  })

  describe('getDesc', function() {
    it('#1', function() {
      expect(epobc.getDesc()).to.equal('epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0')
    })

    it('#2', function() {
      epobc = new EPOBCColorDefinition({ colorId: 1 },
        { txId: '000000000000000020e39bfd5e41ebe61c6dcb9ee6dd6e2ff5f1ef52704c08b1', outIndex: 2, height: 312975 })
      expect(epobc.getDesc()).to.equal('epobc:000000000000000020e39bfd5e41ebe61c6dcb9ee6dd6e2ff5f1ef52704c08b1:2:312975')
    })
  })

  describe('isSpecialTx', function() {
    it('return true', function() {
      epobc = new EPOBCColorDefinition({ colorId: 1 }, { txId: tx1.getId(), outIndex: 0, height: 0 })
      expect(epobc.isSpecialTx(tx1)).to.be.true
    })

    it('return false', function() {
      tx1.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      epobc = new EPOBCColorDefinition({ colorId: 1 }, { txId: tx1.getId(), outIndex: 0, height: 0 })
      expect(epobc.isSpecialTx(tx2)).to.be.false
    })
  })

  describe('Tag', function() {
    var tag

    it('fromTx return null for coinbase', function() {
      tx1.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      tag = EPOBCColorDefinition._Tag.fromTx(tx1)
      expect(tag).to.be.null
    })

    it('fromTx return null for not Xfer and not Genesis', function() {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
      tag = EPOBCColorDefinition._Tag.fromTx(tx1)
      expect(tag).to.be.null
    })

    it('fromTx return Tag', function() {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (1<<6))
      tag = EPOBCColorDefinition._Tag.fromTx(tx1)
      expect(tag).to.be.instanceof(EPOBCColorDefinition._Tag)
      expect(tag.isGenesis).to.equal(true)
      expect(tag.getPadding()).to.equal(2)
    })

    it('closestPaddingCode throw Error', function() {
      var fn = function() { EPOBCColorDefinition._Tag.closestPaddingCode(Math.pow(2,64)) }
      expect(fn).to.throw(Error)
    })

    it('closestPaddingCode return zero', function() {
      var result = EPOBCColorDefinition._Tag.closestPaddingCode(0)
      expect(result).to.equal(0)
    })

    it('closestPaddingCode return two', function() {
      var result = EPOBCColorDefinition._Tag.closestPaddingCode(7)
      expect(result).to.equal(3)
    })

    it('toSequence genesis', function() {
      tag = new EPOBCColorDefinition._Tag(10, true)
      expect(tag.toSequence()).to.equal(677)
    })

    it('toSequence xfer', function() {
      tag = new EPOBCColorDefinition._Tag(10, false)
      expect(tag.toSequence()).to.equal(691)
    })

    it('getPadding return 0', function() {
      tag = new EPOBCColorDefinition._Tag(0, true)
      expect(tag.getPadding()).to.equal(0)
    })

    it('getPadding return pow of 2', function() {
      tag = new EPOBCColorDefinition._Tag(2, true)
      expect(tag.getPadding()).to.equal(4)
    })
  })

  describe('getXferAffectingInputs', function() {
    var affectingInputs

    it('valueWop equal 0 for tx.outs', function() {
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 1)
      expect(affectingInputs).to.deep.equal([])
    })

    it('outValueWop equal 0 for tx.outs', function() {
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 1)
      expect(affectingInputs).to.deep.equal([])
    })

    it('prevTag is null', function() {
      tx2.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      tx1.addInput(tx2.getId(), 0, 4294967295)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.ins[0].prevTx = tx2
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 0)
      expect(affectingInputs).to.deep.equal([])
    })

    it('valueWop equal 0 for tx.ins[0].value', function() {
      tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
      tx1.addInput(tx2.getId(), 0, 4294967295)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.ins[0].prevTx = tx2
      tx1.ins[0].value = 0
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 0)
      expect(affectingInputs).to.deep.equal([])
    })

    it('isAffectingInput is true', function() {
      tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
      tx1.addInput(tx2.getId(), 0, 4294967295)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.ins[0].prevTx = tx2
      tx1.ins[0].value = 2
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 0)
      expect(affectingInputs).to.deep.equal([0])
    })

    it('isAffectingInput is false', function() {
      tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
      tx1.addInput(tx2.getId(), 0, 4294967295)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
      tx1.ins[0].prevTx = tx2
      tx1.ins[0].value = 1
      affectingInputs = EPOBCColorDefinition._getXferAffectingInputs(tx1, 0, 1)
      expect(affectingInputs).to.deep.equal([])
    })
  })

  describe('runKernel', function() {
    it('ensureInputValues return error', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
      epobc.runKernel(tx1, [], stubs.getTxStub([]), function(error, result) {
        expect(error).to.be.instanceof(Error).with.to.have.property('message', 'notFoundTx')
        expect(result).to.be.undefined
        done()
      })
    })

    fixtures.runKernel.forEach(function(f) {
      it(f.description, function(done) {
        if (f.description.indexOf('genesis') !== -1)
          epobc.genesis.txId = f.txId

        tx1 = mocks.createTx(f.txId, f.inputs, f.outputs, f.inputSequenceIndices)

        var colorValueSet = f.inColorValues.map(function(cv) {
          if (cv !== null)
            cv = new cclib.ColorValue(epobc, cv)
          return cv
        })

        epobc.runKernel(tx1, colorValueSet, stubs.getTxStub([]), function(error, result) {
          expect(error).to.be.null
          expect(result).to.be.instanceof(Array)

          result = result.map(function(cv) { return (cv === null ? null : cv.getValue()) })
          expect(result).to.deep.equal(f.expect)

          done()
        })
      })
    })
  })

  describe('getAffectingInputs', function() {
    it('tag is null', function(done) {
      tx1.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      EPOBCColorDefinition.getAffectingInputs(tx1, [], stubs.getTxStub([]), function(error, inputs) {
        expect(error).to.be.null
        expect(inputs).to.deep.equal([])
        done()
      })
    })

    it('tag.isGenesis is true', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37)
      EPOBCColorDefinition.getAffectingInputs(tx1, [], stubs.getTxStub([]), function(error, inputs) {
        expect(error).to.be.null
        expect(inputs).to.deep.equal([])
        done()
      })
    })

    it('ensureInputValues return error', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
      EPOBCColorDefinition.getAffectingInputs(tx1, [], stubs.getTxStub([]), function(error, inputs) {
        expect(error).to.be.instanceof(Error).with.to.have.property('message', 'notFoundTx')
        expect(inputs).to.be.undefined
        done()
      })
    })

    it('return [tx.ins[0]]', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
      tx2.addInput(tx1.getId(), 0, 51 | (2<<6))
      tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
      EPOBCColorDefinition.getAffectingInputs(tx2, [0, 0], stubs.getTxStub([tx1]), function(error, inputs) {
        expect(error).to.be.null
        tx2.ins[0].prevTx = tx1
        tx2.ins[0].value = 11
        expect(inputs).to.deep.equal([tx2.ins[0]])
        done()
      })
    })
  })
})
