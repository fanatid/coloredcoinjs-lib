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
      ds = new store.DataStore({ testEnv: true })
      expect(ds).to.be.instanceof(store.DataStore)
      expect(ds.store).not.to.be.undefined
    })
  })

  describe('ColorDataStore', function() {
    var cdStore
    var txId1 = '0000000000000000000000000000000000000000000000000000000000000000'
    var txId2 = '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff'

    beforeEach(function() {
      cdStore = new store.ColorDataStore({ testEnv: true })
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
      cdStore = new store.ColorDefinitionStore({ testEnv: true })
    })

    afterEach(function() {
      cdStore.clear()
    })

    it('inherits DataStore', function() {
      expect(cdStore).to.be.instanceof(store.DataStore)
      expect(cdStore).to.be.instanceof(store.ColorDefinitionStore)
    })

    it('add/add/get/get', function() {
      var record = cdStore.add({ meta: {}, scheme: epobcScheme1 })
      expect(record).to.deep.equal({ colorId: 1, meta: {}, scheme: epobcScheme1 })

      record = cdStore.add({ meta: {}, scheme: epobcScheme2 })
      expect(record).to.deep.equal({ colorId: 2, meta: {}, scheme: epobcScheme2 })

      record = cdStore.get({ scheme: epobcScheme2 })
      expect(record).to.deep.equal({ colorId: 2, meta: {}, scheme: epobcScheme2 })

      record = cdStore.get({ colorId: 2 })
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
})
