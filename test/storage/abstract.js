/* global describe, beforeEach, it */
var expect = require('chai').expect

var cclib = require('../../')
var AbstractStorage = cclib.storage._AbstractStorage

describe('storage._AbstractStorage', function () {
  var storage

  beforeEach(function () {
    storage = new AbstractStorage()
  })

  describe('ready promise', function () {
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

  describe('ready callback', function (done) {
    it('success', function () {
      expect(storage.isReady()).to.equal(false)
      storage.readyCallback(function (err) {
        expect(err).to.be.null
        expect(storage.isReady()).to.equal(true)
        done()
      })
      storage._setReady()
    })

    it('fail', function (done) {
      expect(storage.isReady()).to.equal(false)
      storage.readyCallback(function (err) {
        expect(err).to.be.instanceof(Error)
        expect(err.message).to.equal('ready error')
        expect(storage.isReady()).to.equal(false)
        done()
      })
      storage._setReady(new Error('ready error'))
    })
  })
})
