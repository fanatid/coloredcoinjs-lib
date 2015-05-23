/* global describe, beforeEach, afterEach, it */
var expect = require('chai').expect

var cclib = require('../')

describe('ColorSet', function () {
  var cdef = new cclib.definitions.Uncolored()
  var cdstorage
  var cdmanager

  beforeEach(function (done) {
    cdstorage = new cclib.storage.definitions.Memory()
    cdstorage.ready.done(done, done)
    cdmanager = new cclib.definitions.Manager(cdstorage)
  })

  afterEach(function (done) {
    cdstorage.clear().done(done, done)
  })

  it('getColorHash', function (done) {
    var cdescs = [
      '',
      'epobc:b95323a763fa507110a89ab857af8e949810cf1e67e91104cd64222a04ccd0bb:0:180679'
    ]
    var cset = new cclib.ColorSet(cdmanager, cdescs)
    cset.ready
      .then(function () {
        return cset.getColorHash()
      })
      .then(function (chash) {
        expect(chash).to.deep.equal('6xgXQgnviwX5Lk')
      })
      .done(done, done)
  })

  it('getColorDescs', function (done) {
    var cset = new cclib.ColorSet(cdmanager, [cdef.getDesc()])
    cset.ready
      .then(function () {
        return cset.getColorDescs()
      })
      .then(function (cdescs) {
        expect(cdescs).to.deep.equal([cdef.getDesc()])
      })
      .done(done, done)
  })

  it('getColorDefinitions', function (done) {
    var cset = new cclib.ColorSet(cdmanager, [cdef.getDesc()])
    cset.ready
      .then(function () {
        return cset.getColorDefinitions()
      })
      .then(function (cdefs) {
        expect(cdefs).to.deep.equal([cdef])
      })
      .done(done, done)
  })

  it('getColorIds', function (done) {
    var cset = new cclib.ColorSet(cdmanager, [cdef.getDesc()])
    cset.ready
      .then(function () {
        return cset.getColorIds()
      })
      .then(function (cids) {
        expect(cids).to.deep.equal([cdef.getColorId()])
      })
      .done(done, done)
  })
})
