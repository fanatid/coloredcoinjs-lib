/* global describe, beforeEach, it */
var expect = require('chai').expect
var _ = require('lodash')

var cclib = require('../../../')

describe('storage.data.Interface', function () {
  var storage

  beforeEach(function () {
    storage = new cclib.storage.data.Interface()
  })

  it('isAvailable', function () {
    expect(cclib.storage.data.Interface.isAvailable()).to.be.false
  })

  it('#add', function (done) {
    storage.add().asCallback(function (err) {
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

  it('#remove', function (done) {
    storage.remove().asCallback(function (err) {
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
