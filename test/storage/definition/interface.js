/* global describe, beforeEach, it */
var expect = require('chai').expect

var cclib = require('../../../')

describe('storage.definition.Interface', function () {
  var storage

  beforeEach(function () {
    storage = new cclib.storage.definition.Interface()
  })

  it('inherits AbstractStorage', function () {
    expect(storage).to.be.instanceof(cclib.storage.definition.Interface)
    expect(storage).to.be.instanceof(cclib.storage._AbstractStorage)
  })

  it('#add', function (done) {
    storage.add().asCallback(function (err) {
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
