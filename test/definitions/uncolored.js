/* global describe, beforeEach, it */
'use strict'

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
    it('fail, wrong color id', function (done) {
      Uncolored.fromDesc('', 1)
        .asCallback(function (err) {
          expect(err).to.be.instanceof(
            cclib.errors.ColorDefinition.IncorrectColorId)
          done()
        })
        .done(_.noop, _.noop)
    })

    it('fail, wrong description', function (done) {
      Uncolored.fromDesc('xxx', 0)
        .asCallback(function (err) {
          expect(err).to.be.instanceof(
            cclib.errors.ColorDefinition.IncorrectDesc)
          done()
        })
        .done(_.noop, _.noop)
    })

    it('successful #1', function (done) {
      Uncolored.fromDesc('', 0)
        .then(function (cdef) {
          expect(cdef.getColorId()).to.equal(0)
        })
        .done(done, done)
    })

    it('successful #2', function (done) {
      Uncolored.fromDesc('')
        .then(function (cdef) {
          expect(cdef.getColorId()).to.equal(0)
        })
        .done(done, done)
    })
  })

  it('fromTx', function (done) {
    Uncolored.fromTx()
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
    Uncolored.getAffectingInputs()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
      .done(_.noop, _.noop)
  })

  it.skip('static makeComposedTx', function (done) {})

  it('static composeGenesisTx', function (done) {
    Uncolored.composeGenesisTx()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
      .done(_.noop, _.noop)
  })
})
