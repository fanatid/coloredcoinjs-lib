/* global describe, beforeEach, it */
var expect = require('chai').expect

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
      expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
      done()
    })
  })

  it('#get', function (done) {
    storage.get().asCallback(function (err) {
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
