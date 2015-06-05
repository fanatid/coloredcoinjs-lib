/* global describe, beforeEach, it */
var _ = require('lodash')
var expect = require('chai').expect

var cclib = require('../../')
var Genesis = cclib.definitions.Genesis

describe('definitions.Genesis', function () {
  var cdef

  beforeEach(function () {
    cdef = new Genesis()
  })

  it('inherits defintions.Interface', function () {
    expect(cdef).to.be.instanceof(cclib.definitions.Interface)
    expect(cdef).to.be.instanceof(Genesis)
  })

  it('static getColorCode', function () {
    var fn = Genesis.getColorCode.bind(Genesis)
    expect(fn).to.throw(cclib.errors.NotImplemented)
  })

  it('getColorCode', function () {
    var fn = cdef.getColorCode.bind(cdef)
    expect(fn).to.throw(cclib.errors.NotImplemented)
  })

  it('getColorId', function () {
    expect(cdef.getColorId()).to.equal(-1)
  })

  it('getDesc', function () {
    var fn = cdef.getDesc.bind(cdef)
    expect(fn).to.throw(cclib.errors.NotImplemented)
  })

  it('static fromDesc', function (done) {
    Genesis.fromDesc()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('fromTx', function (done) {
    Genesis.fromTx()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('runKernel', function (done) {
    cdef.runKernel()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('static getAffectingInputs', function (done) {
    Genesis.getAffectingInputs()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('static makeComposedTx', function (done) {
    Genesis.makeComposedTx()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('static composeGenesisTx', function (done) {
    Genesis.composeGenesisTx()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
      .done(_.noop, _.noop)
  })
})
