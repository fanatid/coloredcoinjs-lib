/* global describe, xdescribe, beforeEach, afterEach, it */
var expect = require('chai').expect
var _ = require('lodash')

var random = require('bitcore').crypto.Random

module.exports = function (opts) {
  var ldescribe = opts.describe || describe
  if (!opts.StorageCls.isAvailable()) {
    ldescribe = xdescribe
  }

  ldescribe('storage.data.' + opts.StorageCls.name, function () {
    var storage
    var record = {
      txid: random.getRandomBuffer(32).toString('hex'),
      vout: 0,
      colorId: 0,
      value: 10
    }

    beforeEach(function (done) {
      storage = new opts.StorageCls(opts.storageOpts)
      storage.ready.done(done, done)
    })

    afterEach(function (done) {
      storage.clear().done(done, done)
    })

    describe('#addColorValue', function () {
      it('same output for given color id already exists', function (done) {
        storage.addColorValue(record)
          .then(function () {
            return storage.addColorValue(record)
          })
          .asCallback(function (err) {
            expect(err).to.be.instanceof(Error)
            done()
          })
          .done(_.noop, _.noop)
      })
    })

    describe('#getColorValues', function () {
      it('output exists', function (done) {
        storage.addColorValue(record)
          .then(function () {
            return storage.getColorValues(record.txid, record.vout)
          })
          .then(function (data) {
            var obj = {}
            obj[record.colorId] = record.value
            expect(data).to.deep.equal(obj)
          })
          .done(done, done)
      })

      it('output not exists', function (done) {
        storage.getColorValues(record.txid, record.vout)
          .then(function (data) {
            expect(data).to.deep.equal({})
          })
          .done(done, done)
      })

      it('output exists, specific color id exists', function (done) {
        storage.addColorValue(record)
          .then(function () {
            return storage.getColorValues(record.txid, record.vout, record.colorId)
          })
          .then(function (value) {
            expect(value).to.equal(record.value)
          })
          .done(done, done)
      })

      it('output exists, specific color id not exists', function (done) {
        return storage.getColorValues(record.txid, record.vout, record.colorId)
          .then(function (value) {
            expect(value).to.be.null
          })
          .done(done, done)
      })
    })

    describe('#isColoredOutput', function () {
      it('true', function (done) {
        storage.addColorValue(record)
          .then(function () {
            return storage.isColoredOutput(record.txid, record.vout)
          })
          .then(function (isColored) {
            expect(isColored).to.be.true
          })
          .done(done, done)
      })

      it('false', function (done) {
        storage.isColoredOutput(record.txid, record.vout)
          .then(function (isColored) {
            expect(isColored).to.be.false
          })
          .done(done, done)
      })
    })

    describe('#removeOutput', function () {
      it('add/get/delete/get', function (done) {
        storage.addColorValue(record)
          .then(function () {
            return storage.getColorValues(record.txid, record.vout)
          })
          .then(function (data) {
            var obj = {}
            obj[record.colorId] = record.value
            expect(data).to.deep.equal(obj)
            return storage.removeOutput(record.txid, record.vout)
          })
          .then(function () {
            return storage.getColorValues(record.txid, record.vout)
          })
          .then(function (data) {
            expect(data).to.deep.equal({})
          })
          .done(done, done)
      })
    })
  })
}
