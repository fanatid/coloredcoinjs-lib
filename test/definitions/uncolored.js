/* global describe, beforeEach, it */
var _ = require('lodash')
var expect = require('chai').expect

var cclib = require('../../')
var Uncolored = cclib.definitions.Uncolored

describe('definitions.Uncolored', function () {
  var cdef

  beforeEach(function () {
    cdef = new Uncolored()
  })

  it('inherits defintions.Interface', function () {
    expect(cdef).to.be.instanceof(cclib.definitions.Interface)
    expect(cdef).to.be.instanceof(Uncolored)
  })

  it('static getColoreCode', function () {
    expect(Uncolored.getColorCode()).to.equal('uncolored')
  })

  it('getColorCode', function () {
    expect(cdef.getColorCode()).to.equal('uncolored')
  })

  it('getColorId', function () {
    expect(cdef.getColorId()).to.equal(0)
  })

  it('getDesc', function () {
    expect(cdef.getDesc()).to.equal('')
  })

  describe('fromDesc', function () {
    it('fail, wrong color id', function () {
      function fn () { Uncolored.fromDesc(1, '') }
      expect(fn).to.throw(cclib.errors.ColorDefinitionBadColorIdError)
    })

    it('fail, wrong description', function () {
      function fn () { Uncolored.fromDesc(0, 'xxx') }
      expect(fn).to.throw(cclib.errors.ColorDefinitionBadDescError)
    })

    it('successful', function () {
      cdef = Uncolored.fromDesc(0, '')
      expect(cdef.getColorId()).to.equal(0)
    })
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
    Uncolored.getAffectingInputs()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
        done()
      })
      .done(_.noop, _.noop)
  })

  it.skip('static makeComposedTx', function (done) {})

  it('static composeGenesisTx', function (done) {
    Uncolored.composeGenesisTx()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
        done()
      })
      .done(_.noop, _.noop)
  })
})
