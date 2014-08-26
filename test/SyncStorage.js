var expect = require('chai').expect
var bitcoin = require('bitcoinjs-lib')

var cclib = require('../src/index')


describe('SyncStorage', function() {
  it('store is defined', function() {
    var storage = new cclib.SyncStorage()
    expect(storage.store).not.to.be.undefined
  })
})
