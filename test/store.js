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

  describe('AddressStore', function() {
    var aStore
    var masterKey1 = 'xprv9s21ZrQH143K2JF8RafpqtKiTbsbaxEeUaMnNHsm5o6wCW3z8ySyH4UxFVSfZ8n7ESu7fgir8imbZKLYVBxFPND1pniTZ81vKfd45EHKX73'
    var pubKeyHex1 = '021c10af30f8380f1ff05a02e10a69bd323a7305c43dc461f79c2b27c13532a12c'
    var pubKeyHex2 = '0375d65343d5dcf4527cf712168b41059cb1df513ba89b44108899835329eb643c'

    beforeEach(function() {
      aStore = new store.AddressStore()
    })

    afterEach(function() {
      aStore.clear()
    })

    it('inherits DataStore', function() {
      expect(aStore).to.be.instanceof(store.DataStore)
      expect(aStore).to.be.instanceof(store.AddressStore)
    })

    it('setMasterKey reset all records', function() {
      aStore.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 })
      aStore.setMasterKey(masterKey1)
      expect(aStore.getAllPubKeys({ account: 0, chain: 0 })).to.have.length(0)
    })

    it('getMasterKey return null', function() {
      expect(aStore.getMasterKey()).to.be.undefined
    })

    it('getMasterKey', function() {
      aStore.setMasterKey(masterKey1)
      expect(aStore.getMasterKey()).to.equal(masterKey1)
    })

    it('addPubKey throw UniqueConstraint for account, chain and index', function() {
      aStore.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 })
      var fn = function() { aStore.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex2 }) }
      expect(fn).to.throw(Error)
    })

    it('addPubKey throw UniqueConstraint for pubKey', function() {
      aStore.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 })
      var fn = function() { aStore.addPubKey({ account: 1, chain: 0, index: 0, pubKey: pubKeyHex1 }) }
      expect(fn).to.throw(Error)
    })

    it('getAllPubKeys', function() {
      aStore.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 })
      aStore.addPubKey({ account: 1, chain: 0, index: 0, pubKey: pubKeyHex2 })
      var pubKeys = aStore.getAllPubKeys({ account: 0, chain: 0 })
      expect(pubKeys).to.deep.equal([{ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 }])
    })

    it('getMaxIndex for empty db', function() {
      var maxIndex = aStore.getMaxIndex({ account: 0, chain: 0 })
      expect(maxIndex).to.be.undefined
    })

    it('getMaxIndex', function() {
      aStore.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex1 })
      aStore.addPubKey({ account: 0, chain: 0, index: 3, pubKey: pubKeyHex2 })
      var maxIndex = aStore.getMaxIndex({ account: 0, chain: 0 })
      expect(maxIndex).to.equal(3)
    })
  })

  describe('ColorDataStore', function() {
    var cdStore
    var txId1 = '0000000000000000000000000000000000000000000000000000000000000000'
    var txId2 = '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff'

    beforeEach(function() {
      cdStore = new store.ColorDataStore()
    })

    afterEach(function() {
      cdStore.clear()
    })

    it('inherits DataStore', function() {
      expect(cdStore).to.be.instanceof(store.DataStore)
      expect(cdStore).to.be.instanceof(store.ColorDataStore)
    })

    it('add/get', function() {
      cdStore.add({ colorId: 1, txId: txId1, outIndex: 0, value: 1 })
      var result = cdStore.get({ colorId: 1, txId: txId1, outIndex: 0})
      expect(result).to.deep.equal({ colorId: 1, txId: txId1, outIndex: 0, value: 1 })
    })

    it('add, throw error uniqueConstraint', function() {
      var fn = function() { cdStore.add({ colorId: 1, txId: txId1, outIndex: 0, value: 1 }) }
      fn()
      expect(fn).to.throw(Error)
    })

    it('get return null', function() {
      cdStore.add({ colorId: 2, txId: txId1, outIndex: 0, value: 1 })
      var result = cdStore.get({ colorId: 1, txId: txId1, outIndex: 0 })
      expect(result).to.be.null
    })
  })

  describe('ColorDefinitionStore', function() {
    var cdStore
    var epobcScheme1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
    var epobcScheme2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

    beforeEach(function() {
      cdStore = new store.ColorDefinitionStore()
    })

    afterEach(function() {
      cdStore.clear()
    })

    it('inherits DataStore', function() {
      expect(cdStore).to.be.instanceof(store.DataStore)
      expect(cdStore).to.be.instanceof(store.ColorDefinitionStore)
    })

    it('add/add/get', function() {
      var record = cdStore.add({ meta: {}, scheme: epobcScheme1 })
      expect(record).to.deep.equal({ colorId: 1, meta: {}, scheme: epobcScheme1 })

      record = cdStore.add({ meta: {}, scheme: epobcScheme2 })
      expect(record).to.deep.equal({ colorId: 2, meta: {}, scheme: epobcScheme2 })

      record = cdStore.get({ scheme: epobcScheme2 })
      expect(record).to.deep.equal({ colorId: 2, meta: {}, scheme: epobcScheme2 })
    })

    it('add, throw error uniqueConstraint', function() {
      var fn = function() { cdStore.add({ meta: {}, scheme: epobcScheme1 }) }
      fn()
      expect(fn).to.throw(Error)
    })

    it('get return null', function() {
      cdStore.add({ meta: {}, scheme: epobcScheme1 })
      var result = cdStore.get({ scheme: epobcScheme2 })
      expect(result).to.be.null
    })

    it('updateMeta', function() {
      cdStore.add({ meta: {}, scheme: epobcScheme1 })
      cdStore.add({ meta: {}, scheme: epobcScheme2 })
      cdStore.updateMeta({ colorId: 2, meta: {'a': 'b'} })
      var result = cdStore.get({ scheme: epobcScheme2 })
      expect(result).to.deep.equal({ colorId: 2, meta: {'a': 'b'}, scheme: epobcScheme2 })
    })

    it('getAll', function() {
      cdStore.add({ meta: {}, scheme: epobcScheme1 })
      cdStore.add({ meta: {}, scheme: epobcScheme2 })
      expect(cdStore.getAll()).to.deep.equal([
        { colorId: 1, meta: {}, scheme: epobcScheme1 },
        { colorId: 2, meta: {}, scheme: epobcScheme2 }
      ])
    })
  })

  describe('ConfigStore', function() {
    var cStore

    beforeEach(function() {
      cStore = new store.ConfigStore()
    })

    afterEach(function() {
      cStore.clear()
    })

    it('inherits DataStore', function() {
      expect(cStore).to.be.instanceof(store.DataStore)
      expect(cStore).to.be.instanceof(store.ConfigStore)
    })

    it('set/get', function() {
      cStore.set('key', 'myValue!!1')
      expect(cStore.get('key')).to.equal('myValue!!1')
    })

    it('get defaultValue', function() {
      expect(cStore.get('key', 'myDefaultValye')).to.equal('myDefaultValye')
    })
  })
})
