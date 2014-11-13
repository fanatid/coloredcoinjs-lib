var expect = require('chai').expect

var cclib = require('../src/index')


describe('ColorDefinitionStorage', function () {
  var cdStore
  var epobcDesc1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  var epobcDesc2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach(function () {
    cdStore = new cclib.ColorDefinitionStorage()
  })

  afterEach(function () {
    cdStore.clear()
  })

  it('inherits SyncStorage', function () {
    expect(cdStore).to.be.instanceof(cclib.SyncStorage)
    expect(cdStore).to.be.instanceof(cclib.ColorDefinitionStorage)
  })

  it('add/add/get/get', function () {
    var record = cdStore.add(epobcDesc1)
    expect(record).to.deep.equal({colorId: 1, desc: epobcDesc1})

    record = cdStore.add(epobcDesc2)
    expect(record).to.deep.equal({colorId: 2, desc: epobcDesc2})

    record = cdStore.getByDesc(epobcDesc2)
    expect(record).to.deep.equal({colorId: 2, desc: epobcDesc2})

    record = cdStore.getByColorId(2)
    expect(record).to.deep.equal({colorId: 2, desc: epobcDesc2})
  })

  it('add, throw error uniqueConstraint', function () {
    var fn = function () { cdStore.add(epobcDesc1) }
    fn()
    expect(fn).to.throw(Error)
  })

  it('getAll', function () {
    cdStore.add(epobcDesc1)
    cdStore.add(epobcDesc2)
    expect(cdStore.getAll()).to.deep.equal([
      {colorId: 1, desc: epobcDesc1},
      {colorId: 2, desc: epobcDesc2}
    ])
  })
})
