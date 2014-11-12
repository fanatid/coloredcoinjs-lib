var expect = require('chai').expect

var cclib = require('../src/index')


describe('ColorDataStorage', function() {
  var cdStore
  var txId1 = '0000000000000000000000000000000000000000000000000000000000000000'

  beforeEach(function() {
    cdStore = new cclib.ColorDataStorage()
  })

  afterEach(function() {
    cdStore.clear()
  })

  it('inherits SyncStorage', function() {
    expect(cdStore).to.be.instanceof(cclib.SyncStorage)
    expect(cdStore).to.be.instanceof(cclib.ColorDataStorage)
  })

  it('add/get', function() {
    cdStore.add({ colorId: 1, txId: txId1, outIndex: 0, value: 1 })
    var result = cdStore.get({ colorId: 1, txId: txId1, outIndex: 0})
    expect(result).to.deep.equal({ colorId: 1, txId: txId1, outIndex: 0, value: 1 })
  })

  it('add throw error', function() {
    cdStore.add({ colorId: 1, txId: txId1, outIndex: 0, value: 1 })
    var fn = function() { cdStore.add({ colorId: 1, txId: txId1, outIndex: 0, value: 2 }) }
    expect(fn).to.throw(Error)
  })

  it('get return null', function() {
    cdStore.add({ colorId: 2, txId: txId1, outIndex: 0, value: 1 })
    var result = cdStore.get({ colorId: 1, txId: txId1, outIndex: 0 })
    expect(result).to.be.null
  })

  it('remove', function() {
    cdStore.add({ colorId: 1, txId: txId1, outIndex: 0, value: 1 })
    var result = cdStore.get({ colorId: 1, txId: txId1, outIndex: 0 })
    expect(result).to.deep.equal({ colorId: 1, txId: txId1, outIndex: 0, value: 1 })

    cdStore.remove({ txId: txId1, outIndex: 0 })
    result = cdStore.get({ colorId: 1, txId: txId1, outIndex: 0 })
    expect(result).to.be.null
  })
})
