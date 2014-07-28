var expect = require('chai').expect
var inherits = require('util').inherits

var coloredcoinlib = require('../src/index')
var blockchain = coloredcoinlib.blockchain
var colordata = coloredcoinlib.colordata
var colordef = coloredcoinlib.colordef
var ColorValue = coloredcoinlib.ColorValue
var store = coloredcoinlib.store
var Transaction = coloredcoinlib.Transaction

var mocks = require('./mocks')
var stubs = require('./stubs')


describe('colordata', function() {
  var cdStore, bs, epobc, tx, tx2, storedcd

  beforeEach(function() {
    cdStore = new store.ColorDataStore()
    bs = new blockchain.BlockchainStateBase()
    epobc = new colordef.EPOBCColorDefinition({ colorId: 1 },
      { txId: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', outIndex: 0, height: 0 })
    tx = new Transaction()
    tx2 = new Transaction()
  })

  afterEach(function() {
    cdStore.clear()
  })

  describe('ThinColorData', function() {
    beforeEach(function() {
      storedcd = new colordata.ThinColorData(cdStore, bs)
    })

    describe('fetchColorValue', function() {
      var colorValue
      var txId = '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff'

      it('return null', function() {
        colorValue = storedcd.fetchColorValue(txId, 0, epobc)
        expect(colorValue).to.be.null
      })

      it('return ColorValue instance', function() {
        cdStore.add({ colorId: epobc.getColorId(), txId: txId, outIndex: 0, value: 10 })
        colorValue = storedcd.fetchColorValue(txId, 0, epobc)
        expect(colorValue).to.be.instanceof(ColorValue)
        expect(colorValue.getValue()).to.equal(10)
      })
    })

    describe('scanTx', function() {
      it('ColorDataStore not empty', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 1, 37)
        cdStore.add({
          colorId: 1,
          txId: '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
          outIndex: 1,
          value: 1
        })
        storedcd.scanTx(tx, [], epobc, function(error) {
          expect(error).to.be.null
          done()
        })
      })

      it('runKernel return error', function(done) {
        epobc.runKernel = function(_, _, _, cb) { cb('error.runKernel') }
        epobc.genesis.txId = tx.getId()
        storedcd.scanTx(tx, [], epobc, function(error) {
          expect(error).to.equal('error.runKernel')
          done()
        })
      })

      it('index not in outputIndices', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        tx2.addInput(tx.getId(), 0, 51 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        bs.getTx = stubs.getTxStub([tx])
        cdStore.add({
          colorId: 1,
          txId: '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
          outIndex: 0,
          value: 6
        })
        storedcd.scanTx(tx2, [], epobc, function(error) {
          expect(error).to.be.null
          done()
        })
      })

      it('ColorDataStore.add throw error', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        tx2.addInput(tx.getId(), 0, 51 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        bs.getTx = stubs.getTxStub([tx])
        cdStore.add({ colorId: 1, txId: tx.getId(), outIndex: 0, value: 6 })
        cdStore.add = function() { throw new Error('error.scanTx') }
        storedcd.scanTx(tx2, [0], epobc, function(error) {
          expect(error).to.deep.equal(new Error('error.scanTx'))
          done()
        })
      })

      it('add record', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
        tx.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
        tx2.addInput(tx.getId(), 0, 51 | (2<<6))
        tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
        bs.getTx = stubs.getTxStub([tx])
        cdStore.add({ colorId: 1, txId: tx.getId(), outIndex: 0, value: 6 })
        storedcd.scanTx(tx2, [0], epobc, function(error) {
          expect(error).to.be.null
          var record = cdStore.get({
            colorId: 1,
            txId: tx2.getId(),
            outIndex: 0
          })
          expect(record.value).to.equal(6)
          done()
        })
      })
    })

    describe('getColorValue', function() {
      it('blockchainState.getTx return error', function(done) {
        storedcd.fetchColorValue = function() { return null }
        bs.getTx = stubs.getTxStub([])
        storedcd.getColorValue(tx.getId(), 0, epobc, function(error, colorValue) {
          expect(error).to.equal('notFoundTx')
          expect(colorValue).to.be.undefined
          done()
        })
      })

      it('colorDefinition.getAffectingInputs return error', function(done) {
        storedcd.fetchColorValue = function() { return null }
        bs.getTx = stubs.getTxStub([tx])
        epobc.getAffectingInputs = function(_, _, _, cb) { cb('error.getAffectingInputs') }
        storedcd.getColorValue(tx.getId(), 0, epobc, function(error, colorValue) {
          expect(error).to.equal('error.getAffectingInputs')
          expect(colorValue).to.be.undefined
          done()
        })
      })

      it('this.scanTx return error', function(done) {
        tx.addInput(tx2.getId(), 0, 37)
        storedcd.fetchColorValue = function() { return null }
        bs.getTx = stubs.getTxStub([tx, tx2])
        epobc.getAffectingInputs = function(_, _, _, cb) { cb(null, [tx.ins[0]]) }
        storedcd.scanTx = function(_, _, _, cb) { cb('error.scanTx') }
        storedcd.getColorValue(tx.getId(), 0, epobc, function(error, colorValue) {
          expect(error).to.equal('error.scanTx')
          expect(colorValue).to.be.undefined
          done()
        })
      })

      it('already in store', function(done) {
        cdStore.add({ colorId: epobc.getColorId(), txId: tx.getId(), outIndex: 0, value: 15 })
        storedcd.getColorValue(tx.getId(), 0, epobc, function(error, colorValue) {
          expect(error).to.be.null
          expect(colorValue).to.be.instanceof(ColorValue)
          expect(colorValue.getColorId()).to.be.equal(epobc.getColorId())
          expect(colorValue.getValue()).to.be.equal(15)
          done()
        })
      })

      it('add to store and return value', function(done) {
        cdStore.add({
          colorId: epobc.getColorId(),
          txId: '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
          outIndex: 1,
          value: 1
        })
        tx = mocks.createTx('ff00111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', [9], [9], [0, 1, 4, 5, 6, 7])
        bs.getTx = stubs.getTxStub([tx])

        storedcd.getColorValue(tx.getId(), 0, epobc, function(error, colorValue) {
          expect(error).to.be.null
          expect(colorValue).to.be.instanceof(ColorValue)
          expect(colorValue.getColorId()).to.be.equal(epobc.getColorId())
          expect(colorValue.getValue()).to.be.equal(1)
          done()
        })
      })
    })
  })
})
