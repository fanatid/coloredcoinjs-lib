var expect = require('chai').expect

var cclib = require('../src/index')


describe('SyncStorage', function () {
  it('store is defined', function () {
    var storage = new cclib.SyncStorage()
    expect(storage).to.be.instanceof(cclib.SyncStorage)
    expect(storage.store).not.to.be.undefined
  })

  it('custom prefix', function () {
    var storage = new cclib.SyncStorage({globalPrefix: 'my_cc_'})
    expect(storage).to.be.instanceof(cclib.SyncStorage)
    expect(storage.store).not.to.be.undefined
  })
})
