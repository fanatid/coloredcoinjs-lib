var expect = require('chai').expect

var cclib = require('../src/index')


describe('ColorDefinitionStorage', function() {
  var cdStore
  var epobcScheme1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  var epobcScheme2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach(function() {
    cdStore = new cclib.ColorDefinitionStorage()
  })

  afterEach(function() {
    cdStore.clear()
  })

  it('inherits SyncStorage', function() {
    expect(cdStore).to.be.instanceof(cclib.SyncStorage)
    expect(cdStore).to.be.instanceof(cclib.ColorDefinitionStorage)
  })

  it('add/add/get/get', function() {
    var record = cdStore.add(epobcScheme1)
    expect(record).to.deep.equal({ colorId: 1, scheme: epobcScheme1 })

    record = cdStore.add(epobcScheme2)
    expect(record).to.deep.equal({ colorId: 2, scheme: epobcScheme2 })

    record = cdStore.getByScheme(epobcScheme2)
    expect(record).to.deep.equal({ colorId: 2, scheme: epobcScheme2 })

    record = cdStore.getByColorId(2)
    expect(record).to.deep.equal({ colorId: 2, scheme: epobcScheme2 })
  })

  it('add, throw error uniqueConstraint', function() {
    var fn = function() { cdStore.add(epobcScheme1) }
    fn()
    expect(fn).to.throw(Error)
  })

  it('getAll', function() {
    cdStore.add(epobcScheme1)
    cdStore.add(epobcScheme2)
    expect(cdStore.getAll()).to.deep.equal([
      { colorId: 1, scheme: epobcScheme1 },
      { colorId: 2, scheme: epobcScheme2 }
    ])
  })
})
