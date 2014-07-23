var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey

var coloredcoinlib = require('../src/index')
var store = coloredcoinlib.store


describe('store', function() {
  describe('UnknownTypeDBError', function() {
    it('inherits Error', function() {
      expect(new store.errors.UnknownTypeDBError()).to.be.instanceof(Error)
      expect(new store.errors.UnknownTypeDBError()).to.be.instanceof(store.errors.UnknownTypeDBError)
    })
  })

  describe('UniqueConstraintError', function() {
    it('inherits Error', function() {
      expect(new store.errors.UniqueConstraintError()).to.be.instanceof(Error)
      expect(new store.errors.UniqueConstraintError()).to.be.instanceof(store.errors.UniqueConstraintError)
    })
  })

  describe('DataStore', function() {
    it('UnknownTypeDBError in constructor', function() {
      var fn = function() { new store.ColorDataStore('') }
      expect(fn).to.throw(store.errors.UnknownTypeDBError)
    })
  })

  describe('AddressManagerStore', function() {
    var ams
    var pubKeyHex1 = '021c10af30f8380f1ff05a02e10a69bd323a7305c43dc461f79c2b27c13532a12c'
    var pubKeyHex2 = '0375d65343d5dcf4527cf712168b41059cb1df513ba89b44108899835329eb643c'

    it('inherits DataStore', function() {
      ams = new store.AddressManagerStore('memory')

      expect(ams).to.be.instanceof(store.DataStore)
      expect(ams).to.be.instanceof(store.AddressManagerStore)
    })

    function getTestFn(beforeEachFn) { return function() {
      beforeEach(beforeEachFn)

      it('addPubKey', function(done) {
        ams.addPubKey('m/0\'/0\'/0', ECPubKey.fromHex(pubKeyHex1), function(error) {
          expect(error).to.be.null
          done()
        })
      })

      it('getPubKey return null', function(done) {
        ams.getPubKey(0, 0, 0, function(error, result) {
          expect(error).to.be.null
          expect(result).to.be.null
          done()
        })
      })

      it('getPubKey', function(done) {
        ams.addPubKey('m/0\'/0\'/0', ECPubKey.fromHex(pubKeyHex1), function(error) {
          expect(error).to.be.null
          ams.getPubKey(0, 0, 0, function(error, result) {
            expect(error).to.be.null
            expect(result).to.deep.equal({ path: 'm/0\'/0\'/0', pubKey: ECPubKey.fromHex(pubKeyHex1) })
            done()
          })
        })
      })

      it('getAllPubKeys return empty list', function(done) {
        ams.getAllPubKeys(0, 0, function(error, result) {
          expect(error).to.be.null
          expect(result).to.deep.equal([])
          done()
        })
      })

      it('getAllPubKeys', function(done) {
        ams.addPubKey('m/0\'/0\'/0', ECPubKey.fromHex(pubKeyHex1), function(error) {
          expect(error).to.be.null
          ams.addPubKey('m/0\'/1\'/0', ECPubKey.fromHex(pubKeyHex2), function(error) {
            expect(error).to.be.null
            ams.getAllPubKeys(0, 0, function(error, result) {
              expect(error).to.be.null
              expect(result).to.deep.equal([{ path: 'm/0\'/0\'/0', pubKey: ECPubKey.fromHex(pubKeyHex1) }])
              done()
            })
          })
        })
      })

      it('getMaxIndex return undefined', function(done) {
        ams.getMaxIndex(0, 0, function(error, index) {
          expect(error).to.be.null
          expect(index).to.be.undefined
          done()
        })
      })

      it('getMaxIndex', function(done) {
        ams.addPubKey('m/0\'/0\'/0', ECPubKey.fromHex(pubKeyHex1), function(error) {
          expect(error).to.be.null
          ams.addPubKey('m/0\'/1\'/0', ECPubKey.fromHex(pubKeyHex2), function(error) {
            expect(error).to.be.null
            ams.getMaxIndex(0, 0, function(error, index) {
              expect(error).to.be.null
              expect(index).to.equal(0)
              done()
            })
          })
        })
      })
    }}

    describe('memory as db', getTestFn(function() {
      ams = new store.AddressManagerStore('memory')
    }))
  })

  describe('ColorDataStore', function() {
    var cds

    it('inherits DataStore', function() {
      cds = new store.ColorDataStore('memory')

      expect(cds).to.be.instanceof(store.DataStore)
      expect(cds).to.be.instanceof(store.ColorDataStore)
    })

    function getTestFn(beforeEachFn) { return function() {
      var txId1 = '0000000000000000000000000000000000000000000000000000000000000000'
      var txId2 = '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff'

      beforeEach(beforeEachFn)

      it('add', function(done) {
        cds.add(1, txId1, 0, 1, function(error) {
          expect(error).to.be.null
          done()
        })
      })

      it('add, UniqueConstraintError', function(done) {
        cds.add(1, txId1, 0, 1, function(error) {
          expect(error).to.be.null
          cds.add(1, txId1, 1, 1, function(error) {
            expect(error).to.be.null
            cds.add(1, txId1, 1, 2, function(error) {
              expect(error).to.be.instanceof(store.errors.UniqueConstraintError)
              done()
            })
          })
        })
      })

      it('get', function(done) {
        cds.add(1, txId1, 1, 1, function(error) {
          expect(error).to.be.null
          cds.add(1, txId1, 0, 1, function(error) {
          expect(error).to.be.null
            cds.get(1, txId1, 0, function(error, record) {
              expect(error).to.be.null
              expect(record).to.deep.equal({
                colorId: 1,
                txId: txId1,
                outIndex: 0,
                value: 1
              })
              done()
            })
          })
        })
      })

      it('get null', function(done) {
        cds.get(1, txId1, 0, function(error, record) {
          expect(error).to.be.null
          expect(record).to.be.null
          done()
        })
      })

      it('getAny', function(done) {
        cds.add(1, txId1, 0, 1, function(error) {
          expect(error).to.be.null
          cds.add(1, txId2, 0, 1, function(error) {
            expect(error).to.be.null
            cds.getAny(txId1, 0, function(error, records) {
              expect(error).to.be.null
              expect(records).to.deep.equal([{
                colorId: 1,
                txId: txId1,
                outIndex: 0,
                value: 1
              }])
              done()
            })
          })
        })
      })
    }}

    describe('memory as db', getTestFn(function() {
      cds = new store.ColorDataStore('memory')
    }))
  })
/*
  describe('ColorDefinitionStore', function() {
    var cms

    beforeEach(function() {
      cms = new store.ColorDefinitionStore('memory')
    })

    it('inherits DataStore', function() {
      expect(cms).to.be.instanceof(store.DataStore)
      expect(cms).to.be.instanceof(store.ColorDefinitionStore)
    })

    function tester() {
      it('not exists and autoAdd is false', function(done) {
        cms.resolveColorDesc('desc', false, function(error, colorId) {
          expect(error).to.be.null
          expect(colorId).to.be.null
          done()
        })
      })

      it('resolveColorDesc thrice', function(done) {
        cms.resolveColorDesc('desc', true, function(error, colorId) {
          expect(error).to.be.null
          expect(colorId).to.equal(1)
          cms.resolveColorDesc('desc2', true, function(error, colorId) {
            expect(error).to.be.null
            expect(colorId).to.equal(2)
            cms.resolveColorDesc('desc', true, function(error, colorId) {
              expect(error).to.be.null
              expect(colorId).to.equal(1)
              done()
            })
          })
        })
      })

      it('findColorDesc', function(done) {
        cms.resolveColorDesc('desc', true, function(error, colorId) {
          expect(error).to.be.null
          cms.findColorDesc(colorId, function(error, colorDesc) {
            expect(error).to.be.null
            expect(colorDesc).to.equal('desc')
            done()
          })
        })
      })

      it('findColorDesc not found', function(done) {
        cms.resolveColorDesc('desc', true, function(error, colorId) {
          expect(error).to.be.null
          cms.findColorDesc(colorId+1, function(error, colorDesc) {
            expect(error).to.be.null
            expect(colorDesc).to.be.null
            done()
          })
        })
      })
    }

    describe('MemoryDB', tester)
  })
*/
})
