/* global describe, beforeEach, it */
var expect = require('chai').expect
var _ = require('lodash')
var bitcore = require('bitcore')
var Promise = require('bluebird')

var cclib = require('../../')
var EPOBC = cclib.definitions.EPOBC
var helpers = require('../helpers')
var fixtures = require('../fixtures/transactions')

describe('coloredcoinjs-lib (balance)', function () {
  var cdefstorage
  var cdmanager
  var cdstorage
  var cdata

  beforeEach(function (done) {
    cdefstorage = new cclib.storage.definitions.Memory()
    cdmanager = new cclib.definitions.Manager(cdefstorage)

    cdstorage = new cclib.storage.data.Memory()
    cdata = new cclib.ColorData(cdstorage, cdmanager)

    Promise.all([cdefstorage.ready, cdstorage.ready])
    .then(_.noop)
    .done(done, done)
  })

  it('EPOBC', function (done) {
    var txid = '694dffbf830e50139c34b80abd20c95f37b1a7e6401be5ef579d6f1f973c6c4c'
    var tx = bitcore.Transaction(fixtures[txid])
    var oidx = 0

    cdata.getOutputColorValue(tx, oidx, EPOBC, helpers.getTxFn)
      .then(function (data) {
        expect(data).to.be.an('array').and.to.have.length(1)
        var cv = data[0]
        expect(cv).to.be.instanceof(cclib.ColorValue)
        expect(cv.getColorDefinition()).to.be.instanceof(EPOBC)
        expect(cv.getColorDefinition()._genesis.txid).to.equal(
          'b8a402f28f247946df2b765f7e52cfcaf8c0714f71b13ae4f151a973647c5170')
        expect(cv.getValue()).to.equal(100000)
      })
      .done(done, done)
  })
})
