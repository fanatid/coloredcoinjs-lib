/* global describe, xdescribe, beforeEach, afterEach, it */
var expect = require('chai').expect

var random = require('bitcore').crypto.Random

module.exports = function (opts) {
  var ldescribe = opts.describe || describe
  if (!opts.StorageCls.isAvailable()) {
    ldescribe = xdescribe
  }

  ldescribe('storage.data.' + opts.StorageCls.name, function () {
    var storage
    var record = {
      txId: random.getRandomBuffer(32).toString('hex'),
      outIndex: 0,
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
      })
    })

    describe('#getColorValues', function () {
      it('output exists', function (done) {
        storage.addColorValue(record)
          .then(function () {
            return storage.getColorValues(record.txId, record.outIndex)
          })
          .asCallback(function (err, data) {
            expect(err).to.be.null
            var obj = {}
            obj[record.colorId] = record.value
            expect(data).to.deep.equal(obj)
            done()
          })
      })

      it('output not exists', function (done) {
        storage.getColorValues(record.txId, record.outIndex)
          .asCallback(function (err, data) {
            expect(err).to.be.null
            expect(data).to.deep.equal({})
            done()
          })
      })
    })

    describe('#isColoredOutput', function () {
      it('true', function (done) {
        storage.addColorValue(record)
          .then(function () {
            return storage.isColoredOutput(record.txId, record.outIndex)
          })
          .asCallback(function (err, isColored) {
            expect(err).to.be.null
            expect(isColored).to.be.true
            done()
          })
      })

      it('false', function (done) {
        storage.isColoredOutput(record.txId, record.outIndex)
          .asCallback(function (err, isColored) {
            expect(err).to.be.null
            expect(isColored).to.be.false
            done()
          })
      })
    })

    describe('#removeOutput', function () {
      it('add/get/delete/get', function (done) {
        storage.addColorValue(record)
          .then(function () {
            return storage.getColorValues(record.txId, record.outIndex)
          })
          .then(function (data) {
            var obj = {}
            obj[record.colorId] = record.value
            expect(data).to.deep.equal(obj)
            return storage.removeOutput(record.txId, record.outIndex)
          })
          .then(function () {
            return storage.getColorValues(record.txId, record.outIndex)
          })
          .asCallback(function (err, data) {
            expect(err).to.be.null
            expect(data).to.deep.equal({})
            done()
          })
      })
    })
  })
}
