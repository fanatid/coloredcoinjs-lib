var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')

var coloredcoinlib = require('../src/index')
var colordef = coloredcoinlib.colordef
var colorvalue = coloredcoinlib.colorvalue


describe('colordef', function() {
  describe('ColorDefinition', function() {
    it('getColorID', function() {
      var colordef1 = new colordef.ColorDefinition(1)
      expect(colordef1.getColorID()).to.equal(1)
    })

    it('genesisOutputMarker', function() {
      expect(colordef.genesisOutputMarker.getColorID()).to.equal(-1)
    })

    it('uncoloredMarker', function() {
      expect(colordef.uncoloredMarker.getColorID()).to.equal(0)
    })
  })

  describe('GenesisColorDefinition', function() {
    it('inherits ColorDefinition', function() {
      var colordef1 = new colordef.GenesisColorDefinition(1, { txHash: 'genesis', outIndex: 0, height: 0 })
      expect(colordef1).to.be.instanceof(colordef.ColorDefinition)
      expect(colordef1).to.be.instanceof(colordef.GenesisColorDefinition)
    })
  })

  describe('EPOBCColorDefinition', function() {
    var bs
    var epobc
    var tx, tx2

    beforeEach(function() {
      bs = new coloredcoinlib.blockchain.BlockchaininfoDataAPI()
      epobc = new colordef.EPOBCColorDefinition(1, { txHash: 'genesis', outIndex: 0, height: 0 })
      tx = new bitcoin.Transaction()
      tx2 = new bitcoin.Transaction()
    })

    it('inherits GenesisColorDefinition', function() {
      expect(epobc).to.be.instanceof(colordef.GenesisColorDefinition)
      expect(epobc).to.be.instanceof(colordef.EPOBCColorDefinition)
    })

    describe('EPOBCColorDefinition Tag', function() {
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

    describe('EPOBCColorDefinition getXferAffectingInputs', function() {
      var affectingInputs

      it('outValueWop equal 0 for tx.outs', function() {
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 0, 0)
        expect(affectingInputs).to.deep.equal([])
      })

      it('prevTag is null', function() {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
        tx2.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
        tx.ins[0].prevTx = tx2
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 0, 0)
        expect(affectingInputs).to.deep.equal([])
      })

      it('valueWop equal 0 for tx.ins[0].value', function() {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
        tx.ins[0].prevTx = tx2
        tx.ins[0].value = 0
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 0, 0)
        expect(affectingInputs).to.deep.equal([])
      })

      it('isAffectingInput is [true]', function() {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
        tx.ins[0].prevTx = tx2
        tx.ins[0].value = 2
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 0, 0)
        expect(affectingInputs).to.deep.equal([0])
      })

      it('isAffectingInput is [false, true]', function() {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 2)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 3)
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
        tx.ins[0].prevTx = tx2
        tx.ins[0].value = 2
        tx.ins[1].prevTx = tx2
        tx.ins[1].value = 4
        affectingInputs = colordef.EPOBCColorDefinition.getXferAffectingInputs(tx, 1, 1)
        expect(affectingInputs).to.deep.equal([1])
      })
    })

    describe('EPOBCColorDefinition ensureInputValues', function() {
      it('isCoinbase is true', function(done) {
        tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
        colordef.EPOBCColorDefinition.ensureInputValues(tx, bs, function(error, newTx) {
          expect(error).to.be.null
          tx.ins[0].value = 0
          expect(newTx).to.deep.equal(tx)
          done()
        })
      })

      it('bs.getTx return error', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
        bs.getTx = function(txHash, cb) { cb('myError', null) }
        colordef.EPOBCColorDefinition.ensureInputValues(tx, bs, function(error, newTx) {
          expect(error).to.equal('myError')
          expect(newTx).to.be.null
          done()
        })
      })

      it('successful get prevTx', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 4294967295)
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
        bs.getTx = function(txHash, cb) { cb(null, tx2.clone()) }
        colordef.EPOBCColorDefinition.ensureInputValues(tx, bs, function(error, newTx) {
          expect(error).to.be.null
          tx.ins[0].prevTx = tx2.clone()
          tx.ins[0].value = tx.ins[0].prevTx.outs[0].value
          expect(newTx).to.deep.equal(tx)
          done()
        })
      })
    })

    describe('runKernel', function() {
      it('tag is null', function(done) {
        tx.addInput('0000000000000000000000000000000000000000000000000000000000000000', 4294967295, 4294967295)
        epobc.runKernel(tx, [], bs, function(error, inputs) {
          expect(error).to.be.null
          expect(inputs).to.deep.equal([])
          done()
        })
      })

      it('tag.isGenesis is true and isGenesisHash is true', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37)
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 5000000000)
        epobc.genesis.txHash = Array.prototype.reverse.call(tx.getHash()).toString('hex')
        epobc.runKernel(tx, [], bs, function(error, inputs) {
          expect(error).to.be.null
          expect(inputs).to.deep.equal([new colorvalue.SimpleColorValue({ colordef: epobc, value: 5000000000 })])
          done()
        })
      })

      it('tag.isGenesis is true and isGenesisHash is true, but valueWop equal 0', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (1<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 1)
        epobc.genesis.txHash = Array.prototype.reverse.call(tx.getHash()).toString('hex')
        epobc.runKernel(tx, [], bs, function(error, inputs) {
          expect(error).to.be.null
          expect(inputs).to.deep.equal([null])
          done()
        })
      })

      it('ensureInputValues return error', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51)
        bs.getTx = function(txHash, cb) { cb('myError', null) }
        epobc.runKernel(tx, [], bs, function(error, inputs) {
          expect(error).to.equal('myError')
          expect(inputs).to.be.null
          done()
        })
      })

      it('outValueWop equal 0', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 2)
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0)
        bs.getTx = function(txHash, cb) { cb(null, tx2) }
        epobc.runKernel(tx, [], bs, function(error, inputs) {
          expect(error).to.be.null
          expect(inputs).to.deep.equal([null])
          done()
        })
      })

      it('colorValueSet[ai] is null', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        bs.getTx = function(txHash, cb) { cb(null, tx2) }
        epobc.runKernel(tx, [null], bs, function(error, inputs) {
          expect(error).to.be.null
          expect(inputs).to.deep.equal([null])
          done()
        })
      })

      it('aiColorValue.add', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        bs.getTx = function(txHash, cb) { cb(null, tx2) }
        var colorValue = new colorvalue.SimpleColorValue({ colordef: epobc, value: 6 })
        epobc.runKernel(tx, [colorValue], bs, function(error, inputs) {
          expect(error).to.be.null
          expect(inputs).to.deep.equal([new colorvalue.SimpleColorValue({ colordef: epobc, value: 6 })])
          done()
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
        bs.getTx = function(txHash, cb) { cb('myError', null) }
        epobc.getAffectingInputs(tx, [], bs, function(error, inputs) {
          expect(error).to.equal('myError')
          expect(inputs).to.be.null
          done()
        })
      })

      it('return [tx.ins[0]]', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 51 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        tx2.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        bs.getTx = function(txHash, cb) { cb(null, tx2) }
        epobc.getAffectingInputs(tx, [0, 0], bs, function(error, inputs) {
          expect(error).to.be.null
          tx.ins[0].prevTx = tx2
          tx.ins[0].value = 11
          expect(inputs).to.deep.equal([tx.ins[0]])
          done()
        })
      })
    })
  })
})
