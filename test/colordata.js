var expect = require('chai').expect
var inherits = require('inherits')

var coloredcoinlib = require('../src/index')
var blockchain = coloredcoinlib.blockchain
var builder = coloredcoinlib.builder
var colordata = coloredcoinlib.colordata
var colordef = coloredcoinlib.colordef
var colorvalue = coloredcoinlib.colorvalue
var store = coloredcoinlib.store
var Transaction = coloredcoinlib.Transaction


describe('colordata', function() {
  var cdstore, bs, epobc, tx, tx2, storedcd

  beforeEach(function() {
    cdstore = new store.ColorDataStore('memory')
    bs = new blockchain.BlockchainStateBase()
    epobc = new colordef.EPOBCColorDefinition(1, { txHash: 'genesis', outIndex: 0, height: 0 })
    tx = new Transaction()
    tx2 = new Transaction()
  })

  describe('StoredColorData', function() {
    beforeEach(function() {
      storedcd = new colordata.StoredColorData(cdstore, bs, builder.AidedColorDataBuilder)
    })

    describe('fetchColorvalues', function() {
      it('colorDataStore.getAny return error', function(done) {
        cdstore.getAny = function(_, _, cb) { cb('myError') }
        storedcd.fetchColorvalues([epobc], tx.getId(), 0, colorvalue.SimpleColorValue, function(error, records) {
          expect(error).to.equal('myError')
          expect(records).to.be.null
          done()
        })
      })

      it('return [colorvalue]', function(done) {
        cdstore.add(epobc.getColorId(), tx.getId(), 0, 1, function(error) {
          expect(error).to.be.null
          cdstore.add(epobc.getColorId()+1, tx.getId(), 0, 2, function(error) {
            expect(error).to.be.null
            storedcd.fetchColorvalues([epobc], tx.getId(), 0, colorvalue.SimpleColorValue, function(error, colorValues) {
              expect(error).to.be.null
              var cv = new colorvalue.SimpleColorValue({ colordef: epobc, value: 1 })
              expect(colorValues).to.deep.equal([cv])
              done()
            })
          })
        })
      })
    })
  })

  describe('ThinColorData', function() {
    beforeEach(function() {
      storedcd = new colordata.ThinColorData(cdstore, bs, builder.AidedColorDataBuilder)
    })

    it('inherits StoredColorData', function() {
      expect(storedcd).to.be.instanceof(colordata.StoredColorData)
      expect(storedcd).to.be.instanceof(colordata.ThinColorData)
    })

    describe('getColorValues', function() {
      var red, blue

      beforeEach(function() {
        red = new colordef.EPOBCColorDefinition(2, { txHash: 'genesis', outIndex: 0, height: 0 })
        blue = new colordef.EPOBCColorDefinition(3, { txHash: 'genesis', outIndex: 0, height: 0 })
      })

      it('fetchColorvalues return error', function(done) {
        storedcd.fetchColorvalues = function(_, _, _, _, cb) { cb('error.fetchColorvalues', null) }
        storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
          expect(error).to.equal('error.fetchColorvalues')
          expect(colorValues).to.be.null
          done()
        })
      })

      it('getTx return error', function(done) {
        storedcd.fetchColorvalues = function(_, _, _, _, cb) { cb(null, []) }
        bs.getTx = function(_, cb) { cb('error.getTx') }
        storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
          expect(error).to.equal('error.getTx')
          expect(colorValues).to.be.null
          done()
        })
      })

      it('getAffectingInputs return error', function(done) {
        storedcd.fetchColorvalues = function(_, _, _, _, cb) { cb(null, []) }
        bs.getTx = function(_, cb) { cb(null, tx2.clone()) }
        epobc.getAffectingInputs = function(_, _, _, cb) { cb('error.getAffectingInputs') }
        storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
          expect(error).to.equal('error.getAffectingInputs')
          expect(colorValues).to.be.null
          done()
        })
      })

      it('processOne return error', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37)
        storedcd.fetchColorvalues = function(_, _, _, _, cb) {
          storedcd.fetchColorvalues = function(_, _, _, _, cb) { cb('error.processOne') }
          cb(null, [])
        }
        bs.getTx = function(_, cb) { cb(null, tx2.clone()) }
        epobc.getAffectingInputs = function(_, _, _, cb) { cb(null, [tx.ins[0]]) }
        storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
          expect(error).to.equal('error.processOne')
          expect(colorValues).to.be.null
          done()
        })
      })

      it('scanTx return error', function(done) {
        function ErrorColorDataBuilder() { builder.AidedColorDataBuilder.apply(this, Array.prototype.slice.call(arguments)) }
        inherits(ErrorColorDataBuilder, builder.AidedColorDataBuilder)
        ErrorColorDataBuilder.prototype.scanTx = function(_, _, cb) { cb('error.scanTx') }
        storedcd = new colordata.ThinColorData(cdstore, bs, ErrorColorDataBuilder)

        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37)
        storedcd.fetchColorvalues = function(_, _, _, _, cb) { cb(null, []) }
        bs.getTx = function(_, cb) { cb(null, tx2.clone()) }
        epobc.getAffectingInputs = function(_, _, _, cb) { cb(null, [tx.ins[0]]) }
        storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
          expect(error).to.equal('error.scanTx')
          expect(colorValues).to.be.null
          done()
        })
      })
    })
  })
})
