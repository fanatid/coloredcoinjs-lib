var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey

var coloredcoinlib = require('../src/index')
var store = coloredcoinlib.store


describe('store', function() {
  function getAvailableDBTest(cls) {
    var availableDB = cls.getAvailableDB()
    expect(availableDB).to.be.instanceof(Array)
    expect(availableDB).to.have.length.of.at.least(1)
  }

  describe('DataStore', function() {
    var ds

    it('constructor', function() {
      ds = new store.DataStore()
      expect(ds).to.be.instanceof(store.DataStore)
      expect(ds.store).not.to.be.undefined
    })
  })

  describe('AddressManagerStore', function() {
    var ams
    var masterKey1 = 'xprv9s21ZrQH143K2JF8RafpqtKiTbsbaxEeUaMnNHsm5o6wCW3z8ySyH4UxFVSfZ8n7ESu7fgir8imbZKLYVBxFPND1pniTZ81vKfd45EHKX73'
    var pubKeyHex1 = '021c10af30f8380f1ff05a02e10a69bd323a7305c43dc461f79c2b27c13532a12c'
    var pubKeyHex2 = '0375d65343d5dcf4527cf712168b41059cb1df513ba89b44108899835329eb643c'

    beforeEach(function() {
      ams = new store.AddressManagerStore()
    })

    afterEach(function() {
      ams.clear()
    })

    it('inherits DataStore', function() {
      expect(ams).to.be.instanceof(store.DataStore)
      expect(ams).to.be.instanceof(store.AddressManagerStore)
    })

    it('setMasterKey reset all records', function() {
      ams.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 })
      ams.setMasterKey(masterKey1)
      expect(ams.getAllPubKeys({ account: 0, chain: 0 })).to.have.length(0)
    })

    it('getMasterKey return null', function() {
      expect(ams.getMasterKey()).to.be.undefined
    })

    it('getMasterKey', function() {
      ams.setMasterKey(masterKey1)
      expect(ams.getMasterKey()).to.equal(masterKey1)
    })

    it('addPubKey throw UniqueConstraint for account, chain and index', function() {
      ams.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 })
      var fn = function() { ams.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex2 }) }
      expect(fn).to.throw(Error)
    })

    it('addPubKey throw UniqueConstraint for pubKey', function() {
      ams.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 })
      var fn = function() { ams.addPubKey({ account: 1, chain: 0, index: 0, pubKey: pubKeyHex1 }) }
      expect(fn).to.throw(Error)
    })

    it('getAllPubKeys', function() {
      ams.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 })
      ams.addPubKey({ account: 1, chain: 0, index: 0, pubKey: pubKeyHex2 })
      var pubKeys = ams.getAllPubKeys({ account: 0, chain: 0 })
      expect(pubKeys).to.deep.equal([{ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 }])
    })

    it('getMaxIndex for empty db', function() {
      var maxIndex = ams.getMaxIndex({ account: 0, chain: 0 })
      expect(maxIndex).to.be.undefined
    })

    it('getMaxIndex', function() {
      ams.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 })
      ams.addPubKey({ account: 0, chain: 0, index: 3, pubKey: pubKeyHex2 })
      var maxIndex = ams.getMaxIndex({ account: 0, chain: 0 })
      expect(maxIndex).to.equal(3)
    })
  })

  describe('ColorDataStore', function() {
    var cds
    var txId1 = '0000000000000000000000000000000000000000000000000000000000000000'
    var txId2 = '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff'

    beforeEach(function() {
      cds = new store.ColorDataStore()
    })

    afterEach(function() {
      cds.clear()
    })

    it('inherits DataStore', function() {
      expect(cds).to.be.instanceof(store.DataStore)
      expect(cds).to.be.instanceof(store.ColorDataStore)
    })

    it('add/get', function() {
      cds.add({ colorId: 1, txId: txId1, outIndex: 0, value: 1 })
      var result = cds.get({ colorId: 1, txId: txId1, outIndex: 0})
      expect(result).to.deep.equal({ colorId: 1, txId: txId1, outIndex: 0, value: 1 })
    })

    it('add, throw error uniqueConstraint', function() {
      var fn = function() { cds.add({ colorId: 1, txId: txId1, outIndex: 0, value: 1 }) }
      fn()
      expect(fn).to.throw(Error)
    })

    it('get return null', function() {
      cds.add({ colorId: 2, txId: txId1, outIndex: 0, value: 1 })
      var result = cds.get({ colorId: 1, txId: txId1, outIndex: 0})
      expect(result).to.be.null
    })

    it('getAny', function() {
      cds.add({ colorId: 1, txId: txId1, outIndex: 0, value: 1 })
      cds.add({ colorId: 1, txId: txId2, outIndex: 0, value: 1 })
      var result = cds.getAny({ txId: txId1, outIndex: 0 })
      expect(result).to.deep.equal([{ colorId: 1, txId: txId1, outIndex: 0, value: 1 }])
    })
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
  describe('ConfigDataStore', function() {
    var cds

    beforeEach(function() {
      cds = new store.ConfigDataStore()
    })

    afterEach(function() {
      cds.clear()
    })

    it('inherits DataStore', function() {
      expect(cds).to.be.instanceof(store.DataStore)
      expect(cds).to.be.instanceof(store.ConfigDataStore)
    })

    it('set/get', function() {
      expect(cds.get()).to.deep.equal({})
      cds.set({msg: 'hello world'})
      expect(cds.get()).to.deep.equal({msg: 'hello world'})
    })
  })
})
