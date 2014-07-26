var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var colordef = coloredcoinlib.colordef
var colorvalue = coloredcoinlib.colorvalue
var Transaction = coloredcoinlib.Transaction

var fixtures = require('./fixtures/colordef')

var mocks = require('./mocks')
var stubs = require('./stubs')


describe('colordef', function() {
  describe('ColorDefinition', function() {
    it('getColorId', function() {
      var colordef1 = new colordef.ColorDefinition(1)
      expect(colordef1.getColorId()).to.equal(1)
    })

    it('genesisOutputMarker', function() {
      expect(colordef.genesisOutputMarker.getColorId()).to.equal(-1)
    })

    it('uncoloredMarker', function() {
      expect(colordef.uncoloredMarker.getColorId()).to.equal(0)
    })
  })

  describe('EPOBCColorDefinition', function() {
    var bs
    var epobc
    var tx, tx2

    beforeEach(function() {
      bs = new coloredcoinlib.blockchain.BlockchainStateBase()
      epobc = new colordef.EPOBCColorDefinition(1,
        { txId: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', outIndex: 0, height: 0 })
      tx = new Transaction()
      tx2 = new Transaction()
    })

    it('isSpecialTx true', function() {
      var epobc1 = new colordef.EPOBCColorDefinition(1, { txId: tx.getId(), outIndex: 0, height: 0 })
      expect(epobc1.isSpecialTx(tx)).to.be.true
    })

    it('isSpecialTx false', function() {
      tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
      var epobc1 = new colordef.EPOBCColorDefinition(1, { txId: tx.getId(), outIndex: 0, height: 0 })
      expect(epobc1.isSpecialTx(tx2)).to.be.false
    })

    it('inherits ColorDefinition', function() {
      expect(epobc).to.be.instanceof(colordef.ColorDefinition)
      expect(epobc).to.be.instanceof(colordef.EPOBCColorDefinition)
    })

    describe('Tag', function() {
      var tag

      it('getPadding return 0', function() {
        tag = new colordef.EPOBCColorDefinition.Tag(0, true)
        expect(tag.getPadding()).to.equal(0)
      })

      it('getPadding return pow of 2', function() {
        tag = new colordef.EPOBCColorDefinition.Tag(2, true)
        expect(tag.getPadding()).to.equal(4)
      })

      it('number2bitArray', function() {
        var bits = colordef.EPOBCColorDefinition.Tag.number2bitArray(54648432)
        expect(bits).to.deep.equal([0,0,0,0,1,1,1,0,0,1,1,1,1,0,1,1,1,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0])
      })

      it('bitArray2number', function() {
        var bits = [0,0,0,0,1,1,1,0,0,1,1,1,1,0,1,1,1,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0]
        expect(colordef.EPOBCColorDefinition.Tag.bitArray2number(bits)).to.equal(54648432)
      })

      it('getTag return null for coinbase', function() {
        tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
        tag = colordef.EPOBCColorDefinition.Tag.getTag(tx)
        expect(tag).to.be.null
      })

      it('getTag return null for not Xfer and not Genesis', function() {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
        tag = colordef.EPOBCColorDefinition.Tag.getTag(tx)
        expect(tag).to.be.null
      })

      it('getTag return Tag', function() {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (1<<6))
        tag = colordef.EPOBCColorDefinition.Tag.getTag(tx)
        expect(tag).to.be.instanceof(colordef.EPOBCColorDefinition.Tag)
        expect(tag.isGenesis).to.equal(true)
        expect(tag.getPadding()).to.equal(2)
      })
    })

    describe('getXferAffectingInputs', function() {
      var affectingInputs

      it('valueWop equal 0 for tx.outs', function() {
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 0, 1)
        expect(affectingInputs).to.deep.equal([])
      })

      it('outValueWop equal 0 for tx.outs', function() {
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 0, 1)
        expect(affectingInputs).to.deep.equal([])
      })

      it('prevTag is null', function() {
        tx2.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
        tx.addInput(tx2.getId(), 0, 4294967295)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
        tx.ins[0].prevTx = tx2
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 0, 0)
        expect(affectingInputs).to.deep.equal([])
      })

      it('valueWop equal 0 for tx.ins[0].value', function() {
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
        tx.addInput(tx2.getId(), 0, 4294967295)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
        tx.ins[0].prevTx = tx2
        tx.ins[0].value = 0
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 0, 0)
        expect(affectingInputs).to.deep.equal([])
      })

      it('isAffectingInput is true', function() {
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
        tx.addInput(tx2.getId(), 0, 4294967295)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
        tx.ins[0].prevTx = tx2
        tx.ins[0].value = 2
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 0, 0)
        expect(affectingInputs).to.deep.equal([0])
      })

      it('isAffectingInput is false', function() {
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
        tx.addInput(tx2.getId(), 0, 4294967295)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
        tx.ins[0].prevTx = tx2
        tx.ins[0].value = 1
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 0, 1)
        expect(affectingInputs).to.deep.equal([])
      })
    })

    describe('runKernel', function() {
      it('ensureInputValues return error', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
        bs.getTx = stubs.getTxStub([])
        epobc.runKernel(tx, [], bs, function(error, result) {
          expect(error).to.equal('notFoundTx')
          expect(result).to.be.undefined
          done()
        })
      })

      fixtures.EPOBCColorDefinition.runKernel.forEach(function(f) {
        it(f.description, function(done) {
          if (f.description.indexOf('genesis') !== -1)
            epobc.genesis.txId = f.txId

          tx = mocks.createTx(f.txId, f.inputs, f.outputs, f.inputSequenceIndices)

          var colorValueSet = f.inColorValues.map(function(cv) {
            if (cv !== null)
              cv = new colorvalue.SimpleColorValue({ colordef: epobc, value: cv })
            return cv
          })

          epobc.runKernel(tx, colorValueSet, bs, function(error, result) {
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
        tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
        epobc.getAffectingInputs(tx, [], bs, function(error, inputs) {
          expect(error).to.be.null
          expect(inputs).to.deep.equal([])
          done()
        })
      })

      it('tag.isGenesis is true', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37)
        epobc.getAffectingInputs(tx, [], bs, function(error, inputs) {
          expect(error).to.be.null
          expect(inputs).to.deep.equal([])
          done()
        })
      })

      it('ensureInputValues return error', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
        bs.getTx = stubs.getTxStub([])
        epobc.getAffectingInputs(tx, [], bs, function(error, inputs) {
          expect(error).to.equal('notFoundTx')
          expect(inputs).to.be.null
          done()
        })
      })

      it('return [tx.ins[0]]', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        tx2.addInput(tx.getId(), 0, 51 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        bs.getTx = stubs.getTxStub([tx])
        epobc.getAffectingInputs(tx2, [0, 0], bs, function(error, inputs) {
          expect(error).to.be.null
          tx2.ins[0].prevTx = tx
          tx2.ins[0].value = 11
          expect(inputs).to.deep.equal([tx2.ins[0]])
          done()
        })
      })
    })
  })
})
