/* global describe, beforeEach, it */
'use strict'

var expect = require('chai').expect
var _ = require('lodash')

var cclib = require('../../../')

describe('storage.definitions.Interface', function () {
  var storage

  beforeEach(function () {
    storage = new cclib.storage.definitions.Interface()
  })

  it('isAvailable', function () {
    expect(cclib.storage.definitions.Interface.isAvailable()).to.be.false
  })

  it('#resolve', function (done) {
    storage.resolve().asCallback(function (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      done()
    })
    .done(_.noop, _.noop)
  })

  it('#get', function (done) {
    storage.get().asCallback(function (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      done()
    })
    .done(_.noop, _.noop)
  })

  it('#clear', function (done) {
    storage.clear().asCallback(function (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      done()
    })
    .done(_.noop, _.noop)
  })
})
