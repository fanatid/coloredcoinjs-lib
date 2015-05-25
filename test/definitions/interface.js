/* global describe, beforeEach, it */
var _ = require('lodash')
var expect = require('chai').expect

var cclib = require('../../')
var Interface = cclib.definitions.Interface

describe('definitions.Interface', function () {
  var cdef

  beforeEach(function () {
    cdef = new Interface(1)
  })

  it('static getColorCode', function () {
    expect(Interface.getColorCode).to.throw(cclib.errors.NotImplementedError)
  })

  it('getColorCode', function () {
    var fn = cdef.getColorCode.bind(cdef)
    expect(fn).to.throw(cclib.errors.NotImplementedError)
  })

  it('colorId', function () {
    expect(cdef.getColorId()).to.equal(1)
  })

  it('desc', function () {
    expect(cdef.getDesc).to.throw(cclib.errors.NotImplementedError)
  })

  it('static fromDesc', function () {
    expect(Interface.fromDesc).to.throw(
      cclib.errors.NotImplementedError)
  })

  it('runKernel', function (done) {
    cdef.runKernel()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('static getAffectingInputs', function (done) {
    Interface.getAffectingInputs()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('static makeComposedTx', function (done) {
    Interface.makeComposedTx()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('static composeGenesisTx', function (done) {
    Interface.composeGenesisTx()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
        done()
      })
      .done(_.noop, _.noop)
  })
})
