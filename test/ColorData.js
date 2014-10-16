var expect = require('chai').expect
var inherits = require('util').inherits

var cclib = require('../src/index')
var mocks = require('./mocks')
var stubs = require('./stubs')


describe('ColorData', function() {
  var cdStorage, epobc, tx1, tx2, cData

  beforeEach(function() {
    cdStorage = new cclib.ColorDataStorage()
    epobc = new cclib.EPOBCColorDefinition(1,
      { txId: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', outIndex: 0, height: 0 })
    tx1 = new cclib.bitcoin.Transaction()
    tx2 = new cclib.bitcoin.Transaction()
    cData = new cclib.ColorData(cdStorage)
  })

  afterEach(function() {
    cdStorage.clear()
  })

  describe('fetchColorValue', function() {
    var colorValue
    var txId = '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff'

    it('return null', function() {
      colorValue = cData.fetchColorValue(txId, 0, epobc)
      expect(colorValue).to.be.null
    })

    it('return ColorValue instance', function() {
      cdStorage.add({ colorId: epobc.getColorId(), txId: txId, outIndex: 0, value: 10 })
      colorValue = cData.fetchColorValue(txId, 0, epobc)
      expect(colorValue).to.be.instanceof(cclib.ColorValue)
      expect(colorValue.getValue()).to.equal(10)
    })
  })

  describe('scanTx', function() {
    it('ColorDataStore not empty', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 1, 37)
      cdStorage.add({
        colorId: 1,
        txId: '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
        outIndex: 1,
        value: 1
      })
      cData.scanTx(tx1, [], epobc, stubs.getTxStub([]), function(error) {
        expect(error).to.be.null
        done()
      })
    })

    it('runKernel return error', function(done) {
      epobc.runKernel = function(_, _, _, cb) { cb('error.runKernel') }
      epobc.genesis.txId = tx1.getId()
      cData.scanTx(tx1, [], epobc, stubs.getTxStub([]), function(error) {
        expect(error).to.equal('error.runKernel')
        done()
      })
    })

    it('index not in outputIndices', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
      tx2.addInput(tx1.getId(), 0, 51 | (2<<6))
      tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
      cdStorage.add({
        colorId: 1,
        txId: '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
        outIndex: 0,
        value: 6
      })
      cData.scanTx(tx2, [], epobc, stubs.getTxStub([tx1]), function(error) {
        expect(error).to.be.null
        done()
      })
    })

    it('ColorDataStore.add throw error', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
      tx2.addInput(tx1.getId(), 0, 51 | (2<<6))
      tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
      cdStorage.add({ colorId: 1, txId: tx1.getId(), outIndex: 0, value: 6 })
      cdStorage.add = function() { throw new Error('error.scanTx') }
      cData.scanTx(tx2, [0], epobc, stubs.getTxStub([tx1]), function(error) {
        expect(error).to.be.instanceof(Error)
        expect(error.message).to.equal('error.scanTx')
        done()
      })
    })

    it('add record', function(done) {
      tx1.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37 | (2<<6))
      tx1.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 11)
      tx2.addInput(tx1.getId(), 0, 51 | (2<<6))
      tx2.addOutput('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10)
      cdStorage.add({ colorId: 1, txId: tx1.getId(), outIndex: 0, value: 6 })
      cData.scanTx(tx2, [0], epobc, stubs.getTxStub([tx1]), function(error) {
        expect(error).to.be.null
        var record = cdStorage.get({
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
      cData.fetchColorValue = function() { return null }
      cData.getColorValue(tx1.getId(), 0, epobc, stubs.getTxStub([]), function(error, colorValue) {
        expect(error).to.be.instanceof(Error).with.to.have.property('message', 'notFoundTx')
        expect(colorValue).to.be.undefined
        done()
      })
    })

    it('this.scanTx return error', function(done) {
      tx1.addInput(tx2.getId(), 0, 37)
      cData.fetchColorValue = function() { return null }
      epobc.getAffectingInputs = function(_, _, _, cb) { cb(null, [tx1.ins[0]]) }
      cData.scanTx = function(_, _, _, _, cb) { cb('error.scanTx') }
      cData.getColorValue(tx1.getId(), 0, epobc, stubs.getTxStub([tx1, tx2]), function(error, colorValue) {
        expect(error).to.equal('error.scanTx')
        expect(colorValue).to.be.undefined
        done()
      })
    })

    it('already in store', function(done) {
      cdStorage.add({ colorId: epobc.getColorId(), txId: tx1.getId(), outIndex: 0, value: 15 })
      cData.getColorValue(tx1.getId(), 0, epobc, stubs.getTxStub([]), function(error, colorValue) {
        expect(colorValue).to.be.instanceof(cclib.ColorValue)
        expect(colorValue.getColorId()).to.be.equal(epobc.getColorId())
        expect(colorValue.getValue()).to.be.equal(15)
        done()
      })
    })

    it.skip('add to store and return value', function(done) {
      cdStorage.add({
        colorId: epobc.getColorId(),
        txId: '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff',
        outIndex: 1,
        value: 1
      })
      tx1 = mocks.createTx('ff00111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', [9], [9], [0, 1, 4, 5, 6, 7])
      bs.getTx = stubs.getTxStub([tx1])

      cData.getColorValue(tx1.getId(), 0, epobc, function(error, colorValue) {
        expect(error).to.be.null
        expect(colorValue).to.be.instanceof(cclib.ColorValue)
        expect(colorValue.getColorId()).to.be.equal(epobc.getColorId())
        expect(colorValue.getValue()).to.be.equal(1)
        done()
      })
    })
  })
})
