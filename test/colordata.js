var expect = require('chai').expect
var inherits = require('util').inherits

var coloredcoinlib = require('../src/index')
var blockchain = coloredcoinlib.blockchain
var builder = coloredcoinlib.builder
var colordata = coloredcoinlib.colordata
var colordef = coloredcoinlib.colordef
var colorvalue = coloredcoinlib.colorvalue
var store = coloredcoinlib.store
var Transaction = coloredcoinlib.Transaction

var fixtures = require('./fixtures/colordata')

var mocks = require('./mocks')
var stubs = require('./stubs')


describe('colordata', function() {
  var cdstore, bs, epobc, tx, tx2, storedcd

  beforeEach(function() {
    cdstore = new store.ColorDataStore('memory')
    bs = new blockchain.BlockchainStateBase()
    epobc = new colordef.EPOBCColorDefinition(1,
      { txId: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', outIndex: 0, height: 0 })
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
          expect(records).to.be.undefined
          done()
        })
      })

      fixtures.StoredColorData.fetchColorvalues.forEach(function(f) {
        it(f.description, function(done) {
          var colorDefinitionSet = f.colorDefinitionIds.map(function(colorId) {
            return new colordef.EPOBCColorDefinition(colorId,
              { txId: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', outIndex: 0, height: 0 })
          })

          function add(index) {
            if (index === f.store.length) {
              storedcd.fetchColorvalues(colorDefinitionSet, f.txId, f.outIndex, colorvalue.SimpleColorValue, fetchColorvaluesCallback)
              return
            }

            var record = f.store[index]
            cdstore.add(record.colorId, record.txId, record.outIndex, record.value, function(error) {
              expect(error).to.be.null
              add(index+1)
            })
          }

          function fetchColorvaluesCallback(error, colorValues) {
            expect(error).to.be.null
            expect(colorValues).to.be.instanceof(Array).and.to.have.length(f.expect.length)
            f.expect.forEach(function(cv, i) {
              expect(colorValues[i].getColorId()).to.be.equal(cv.colorId)
              expect(colorValues[i].getValue()).to.be.equal(cv.value)
            })
            done()
          }

          add(0)
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
      it('fetchColorvalues return error', function(done) {
        storedcd.fetchColorvalues = function(_, _, _, _, cb) { cb('error.fetchColorvalues', null) }
        storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
          expect(error).to.equal('error.fetchColorvalues')
          expect(colorValues).to.be.undefined
          done()
        })
      })

      it('getTx return error', function(done) {
        storedcd.fetchColorvalues = function(_, _, _, _, cb) { cb(null, []) }
        bs.getTx = stubs.getTxStub([])
        storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
          expect(error).to.equal('notFoundTx')
          expect(colorValues).to.be.undefined
          done()
        })
      })

      it('getAffectingInputs return error', function(done) {
        storedcd.fetchColorvalues = function(_, _, _, _, cb) { cb(null, []) }
        bs.getTx = stubs.getTxStub([tx])
        epobc.getAffectingInputs = function(_, _, _, cb) { cb('error.getAffectingInputs') }
        storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
          expect(error).to.equal('error.getAffectingInputs')
          expect(colorValues).to.be.undefined
          done()
        })
      })

      it('processOne return error', function(done) {
        tx.addInput('0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 37)
        storedcd.fetchColorvalues = function(_, _, _, _, cb) {
          storedcd.fetchColorvalues = function(_, _, _, _, cb) { cb('error.processOne') }
          cb(null, [])
        }
        bs.getTx = stubs.getTxStub([tx])
        epobc.getAffectingInputs = function(_, _, _, cb) { cb(null, [tx.ins[0]]) }
        storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
          expect(error).to.equal('error.processOne')
          expect(colorValues).to.be.undefined
          done()
        })
      })

      it('scanTx return error', function(done) {
        function ErrorColorDataBuilder() { builder.AidedColorDataBuilder.apply(this, Array.prototype.slice.call(arguments)) }
        inherits(ErrorColorDataBuilder, builder.AidedColorDataBuilder)
        ErrorColorDataBuilder.prototype.scanTx = function(_, _, cb) { cb('error.scanTx') }
        storedcd = new colordata.ThinColorData(cdstore, bs, ErrorColorDataBuilder)

        tx.addInput(tx2.getId(), 0, 37)
        storedcd.fetchColorvalues = function(_, _, _, _, cb) { cb(null, []) }
        bs.getTx = stubs.getTxStub([tx, tx2])
        epobc.getAffectingInputs = function(_, _, _, cb) { cb(null, [tx.ins[0]]) }
        storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
          expect(error).to.equal('error.scanTx')
          expect(colorValues).to.be.undefined
          done()
        })
      })

      it('already in store', function(done) {
        cdstore.add(epobc.getColorId(), tx.getId(), 0, 1, function(error) {
          expect(error).to.be.null
          storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
            expect(error).to.be.null
            expect(colorValues).to.be.instanceof(Array).and.to.have.length(1)
            expect(colorValues[0].getColorId()).to.be.equal(epobc.getColorId())
            expect(colorValues[0].getValue()).to.be.equal(1)
            done()
          })
        })
      })

      it('add to store and return value', function(done) {
        cdstore.add(epobc.getColorId(), '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 1, 1, function(error) {
          expect(error).to.be.null

          tx = mocks.createTx('ff00111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', [9], [9], [0, 1, 4, 5, 6, 7])
          bs.getTx = stubs.getTxStub([tx])

          storedcd.getColorValues([epobc], tx.getId(), 0, function(error, colorValues) {
            expect(error).to.be.null
            expect(colorValues).to.be.instanceof(Array).and.to.have.length(1)
            expect(colorValues[0].getColorId()).to.be.equal(epobc.getColorId())
            expect(colorValues[0].getValue()).to.be.equal(1)
            done()
          })
        })
      })
    })
  })
})
