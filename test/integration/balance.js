/* global describe, beforeEach, afterEach, it */
var expect = require('chai').expect
var bitcore = require('bitcore')

var cclib = require('../../')
var helpers = require('../helpers')
var fixtures = require('../fixtures/transactions')

describe('coloredcoinjs-lib (balance)', function () {
  var cdStorage
  var cdata

  beforeEach(function (done) {
    cdStorage = new cclib.storage.data.Memory()
    cdStorage.ready.done(done, done)
    cdata = new cclib.ColorData(cdStorage)
  })

  afterEach(function (done) {
    cdStorage.clear().done(done, done)
  })

  it('EPOBC', function (done) {
    var txid = '694dffbf830e50139c34b80abd20c95f37b1a7e6401be5ef579d6f1f973c6c4c'
    var tx = bitcore.Transaction(fixtures[txid])
    var vout = 0

    var epobc = cclib.definitions.EPOBC.fromDesc(
      1, 'epobc:b8a402f28f247946df2b765f7e52cfcaf8c0714f71b13ae4f151a973647c5170:0:314325')

    cdata.getOutputColorValue(tx, vout, epobc, helpers.getTxFn)
      .then(function (cvalue) {
        expect(cvalue).to.be.instanceof(cclib.ColorValue)
        expect(cvalue.getValue()).to.be.equal(100000)
      })
      .done(done, done)
  })
})
