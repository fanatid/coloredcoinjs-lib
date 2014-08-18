var expect = require('chai').expect

var cclib = require('../src/index')
var EPOBCColorDefinition = cclib.color.EPOBCColorDefinition
var mocks = require('./mocks')
var stubs = require('./stubs')

var fixtures = require('./fixtures/color.EPOBCColorDefinition')


describe('color.EPOBCColorDefinition', function() {
  var bs
  var epobc
  var tx1, tx2

  beforeEach(function() {
    bs = new cclib.blockchain.BlockchainStateBase()
    epobc = new EPOBCColorDefinition({ colorId: 1 },
      { txId: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', outIndex: 0, height: 0 })
    tx1 = new cclib.tx.Transaction()
    tx2 = new cclib.tx.Transaction()
  })

  it('inherits ColorDefinition', function() {
    expect(epobc).to.be.instanceof(cclib.color.ColorDefinition)
    expect(epobc).to.be.instanceof(EPOBCColorDefinition)
  })

  describe('fromScheme', function() {
    it('throw error', function(){
      function fn() { EPOBCColorDefinition.fromScheme(1, 'obc:11:2:3') }
      expect(fn).to.throw(Error)
    })

    it('create new EPOBCColorDefinition', function() {
      epobc = EPOBCColorDefinition.fromScheme(epobc.getColorId(), epobc.getScheme())
      expect(epobc).to.deep.equal(epobc)
    })
  })

  describe('getScheme', function() {
    it('#1', function() {
      expect(epobc.getScheme()).to.equal('epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0')
    })

    it('#2', function() {
      epobc = new EPOBCColorDefinition({ colorId: 1 },
        { txId: '000000000000000020e39bfd5e41ebe61c6dcb9ee6dd6e2ff5f1ef52704c08b1', outIndex: 2, height: 312975 })
      expect(epobc.getScheme()).to.equal('epobc:000000000000000020e39bfd5e41ebe61c6dcb9ee6dd6e2ff5f1ef52704c08b1:2:312975')
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

    it('getPadding return 0', function() {
      tag = new EPOBCColorDefinition._Tag(0, true)
      expect(tag.getPadding()).to.equal(0)
    })

    it('getPadding return pow of 2', function() {
      tag = new EPOBCColorDefinition._Tag(2, true)
      expect(tag.getPadding()).to.equal(4)
    })

    it('number2bitArray', function() {
      var bits = EPOBCColorDefinition._Tag.number2bitArray(54648432)
      expect(bits).to.deep.equal([0,0,0,0,1,1,1,0,0,1,1,1,1,0,1,1,1,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0])
    })

    it('bitArray2number', function() {
      var bits = [0,0,0,0,1,1,1,0,0,1,1,1,1,0,1,1,1,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0]
      expect(EPOBCColorDefinition._Tag.bitArray2number(bits)).to.equal(54648432)
    })

    it('getTag return null for coinbase', function() {
      tx1.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      tag = EPOBCColorDefinition._Tag.getTag(tx1)
      expect(tag).to.be.null
    })

    it('getTag return null for not Xfer and not Genesis', function() {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
      tag = EPOBCColorDefinition._Tag.getTag(tx1)
      expect(tag).to.be.null
    })

    it('getTag return Tag', function() {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (1<<6))
      tag = EPOBCColorDefinition._Tag.getTag(tx1)
      expect(tag).to.be.instanceof(EPOBCColorDefinition._Tag)
      expect(tag.isGenesis).to.equal(true)
      expect(tag.getPadding()).to.equal(2)
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
      bs.getTx = stubs.getTxStub([])
      epobc.runKernel(tx1, [], bs, function(error, result) {
        expect(error).to.equal('notFoundTx')
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
            cv = new cclib.color.ColorValue(epobc, cv)
          return cv
        })

        epobc.runKernel(tx1, colorValueSet, bs, function(error, result) {
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
      epobc.getAffectingInputs(tx1, [], bs, function(error, inputs) {
        expect(error).to.be.null
        expect(inputs).to.deep.equal([])
        done()
      })
    })

    it('tag.isGenesis is true', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37)
      epobc.getAffectingInputs(tx1, [], bs, function(error, inputs) {
        expect(error).to.be.null
        expect(inputs).to.deep.equal([])
        done()
      })
    })

    it('ensureInputValues return error', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
      bs.getTx = stubs.getTxStub([])
      epobc.getAffectingInputs(tx1, [], bs, function(error, inputs) {
        expect(error).to.equal('notFoundTx')
        expect(inputs).to.be.undefined
        done()
      })
    })

    it('return [tx.ins[0]]', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
      tx2.addInput(tx1.getId(), 0, 51 | (2<<6))
      tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
      bs.getTx = stubs.getTxStub([tx1])
      epobc.getAffectingInputs(tx2, [0, 0], bs, function(error, inputs) {
        expect(error).to.be.null
        tx2.ins[0].prevTx = tx1
        tx2.ins[0].value = 11
        expect(inputs).to.deep.equal([tx2.ins[0]])
        done()
      })
    })
  })
})
