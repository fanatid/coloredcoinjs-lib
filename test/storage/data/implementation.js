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
      vout: 2,
      colorId: 1,
      value: 10
    }

    beforeEach(function (done) {
      storage = new opts.StorageCls(opts.storageOpts)
      storage.ready.done(done, done)
    })

    afterEach(function (done) {
      storage.clear().done(done, done)
    })

    describe('#add', function () {
      it('same output for given color id already exists', function (done) {
        storage.add(record)
          .then(function () {
            return storage.add(record)
          })
          .asCallback(function (err) {
            expect(err).to.be.instanceof(Error)
            done()
          })
          .done(_.noop, _.noop)
      })
    })

    describe('#get', function () {
      beforeEach(function (done) {
        storage.add(record).then(_.noop).done(done, done)
      })

      it('output not exists', function (done) {
        storage.get({txid: random.getRandomBuffer(32).toString('hex')})
          .then(function (data) {
            expect(data).to.deep.equal({})
          })
          .done(done, done)
      })

      it('output exists', function (done) {
        return storage.get({txid: record.txid})
          .then(function (data) {
            var obj = _.set({}, record.vout, {})
            _.set(obj[record.vout], record.colorId, record.value)
            expect(data).to.deep.equal(obj)
          })
          .done(done, done)
      })

      it('output exists, specific vout', function (done) {
        return storage.get({txid: record.txid, vout: record.vout})
          .then(function (data) {
            var obj = _.set({}, record.colorId, record.value)
            expect(data).to.deep.equal(obj)
          })
          .done(done, done)
      })

      it('output exists, specific vout with specific colorId', function (done) {
        return storage.get({txid: record.txid, vout: record.vout, colorId: record.colorId})
          .then(function (value) {
            expect(value).to.equal(record.value)
          })
          .done(done, done)
      })

      it('output exists, specific colorId', function (done) {
        return storage.get({txid: record.txid, colorId: record.colorId})
          .then(function (data) {
            var obj = _.set({}, record.vout, record.value)
            expect(data).to.deep.equal(obj)
          })
          .done(done, done)
      })
    })

    describe('#remove', function () {
      it('add/get/delete/get', function (done) {
        storage.add(record)
          .then(function () {
            return storage.get({txid: record.txid, vout: record.vout, colorId: record.colorId})
          })
          .then(function (value) {
            expect(value).to.equal(record.value)
            return storage.remove(record.txid)
          })
          .then(function () {
            return storage.get({txid: record.txid})
          })
          .then(function (data) {
            expect(data).to.deep.equal({})
          })
          .done(done, done)
      })
    })
  })
}
