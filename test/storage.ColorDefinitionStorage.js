var expect = require('chai').expect

var cclib = require('../src/index')


describe('storage.ColorDefinitionStorage', function() {
  var cdStore
  var epobcScheme1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  var epobcScheme2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach(function() {
    cdStore = new cclib.storage.ColorDefinitionStorage()
  })

  afterEach(function() {
    cdStore.clear()
  })

  it('inherits SyncStorage', function() {
    expect(cdStore).to.be.instanceof(cclib.storage.SyncStorage)
    expect(cdStore).to.be.instanceof(cclib.storage.ColorDefinitionStorage)
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
