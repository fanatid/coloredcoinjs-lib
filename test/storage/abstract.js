/* global describe, beforeEach, it */
var expect = require('chai').expect

var cclib = require('../../')

describe('storage._AbstractStorage', function () {
  var storage

  beforeEach(function () {
    storage = new cclib.storage._AbstractStorage()
  })

  it('isAvailable', function () {
    expect(cclib.storage._AbstractStorage.isAvailable()).to.be.false
  })

  it('success', function (done) {
    expect(storage.isReady()).to.equal(false)
    storage.ready
      .then(function () {
        expect(storage.isReady()).to.equal(true)
      })
      .done(done, done)
    storage._setReady()
  })

  it('fail', function (done) {
    expect(storage.isReady()).to.equal(false)
    storage.ready
      .then(function () {
        throw new Error('Unexpected behaviour')
      })
      .catch(function (err) {
        expect(err).to.be.instanceof(Error)
        expect(err.message).to.equal('ready error')
        expect(storage.isReady()).to.equal(false)
      })
      .done(done, done)
    storage._setReady(new Error('ready error'))
  })
})
