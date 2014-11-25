var expect = require('chai').expect

var cclib = require('../src/index')


describe('ColorDataStorage', function () {
  var cdStore
  var txId1 = '0000000000000000000000000000000000000000000000000000000000000000'

  beforeEach(function () {
    cdStore = new cclib.ColorDataStorage({saveTimeout: 100})
    cdStore.clear()
  })

  afterEach(function () {
    cdStore.clear()
    cdStore = undefined
  })

  it('inherits SyncStorage', function () {
    expect(cdStore).to.be.instanceof(cclib.SyncStorage)
    expect(cdStore).to.be.instanceof(cclib.ColorDataStorage)
  })

  it('delayed save', function (done) {
    var data = {colorId: 1, txId: txId1, outIndex: 0, value: 1}
    cdStore.add(data)
    expect(cdStore.store.get(cdStore.colorTxsDBKey)).to.be.undefined
    setTimeout(function () {
      expect(cdStore.store.get(cdStore.colorTxsDBKey)).to.deep.equal([data])
      done()
    }, 200)
  })

  it('add/get', function () {
    cdStore.add({colorId: 1, txId: txId1, outIndex: 0, value: 1})
    var result = cdStore.getValue({colorId: 1, txId: txId1, outIndex: 0})
    expect(result).to.deep.equal(1)
  })

  it('add throw error', function () {
    cdStore.add({colorId: 1, txId: txId1, outIndex: 0, value: 1})
    var fn = function () { cdStore.add({colorId: 1, txId: txId1, outIndex: 0, value: 2}) }
    expect(fn).to.throw(Error)
  })

  it('get return null', function () {
    cdStore.add({colorId: 2, txId: txId1, outIndex: 0, value: 1})
    var result = cdStore.getValue({colorId: 1, txId: txId1, outIndex: 0})
    expect(result).to.be.null
  })

  it('remove', function () {
    cdStore.add({colorId: 1, txId: txId1, outIndex: 0, value: 1})
    var result = cdStore.getValue({colorId: 1, txId: txId1, outIndex: 0})
    expect(result).to.deep.equal(1)

    cdStore.remove({txId: txId1, outIndex: 0})
    result = cdStore.getValue({colorId: 1, txId: txId1, outIndex: 0})
    expect(result).to.be.null
  })
})
