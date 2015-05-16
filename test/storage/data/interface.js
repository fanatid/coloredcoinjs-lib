/* global describe, beforeEach, it */
var expect = require('chai').expect

var cclib = require('../../../')

describe('storage.data.Interface', function () {
  var storage

  beforeEach(function () {
    storage = new cclib.storage.data.Interface()
  })

  it('isAvailable', function () {
    expect(cclib.storage.data.Interface.isAvailable()).to.be.false
  })

  it('#addColorValue', function (done) {
    storage.addColorValue().asCallback(function (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
      done()
    })
  })

  it('#getColorValues', function (done) {
    storage.getColorValues().asCallback(function (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
      done()
    })
  })

  it('#isColoredOutput', function (done) {
    storage.isColoredOutput().asCallback(function (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
      done()
    })
  })

  it('#removeOutput', function (done) {
    storage.removeOutput().asCallback(function (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
      done()
    })
  })

  it('#clear', function (done) {
    storage.clear().asCallback(function (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
      done()
    })
  })
})
