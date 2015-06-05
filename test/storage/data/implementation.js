/* global describe, xdescribe, beforeEach, afterEach, it */
/* globals Promise:true */
var expect = require('chai').expect
var _ = require('lodash')
var Promise = require('bluebird')
var random = require('bitcore').crypto.Random

var cclib = require('../../../')

module.exports = function (opts) {
  if (opts.StorageCls === undefined) {
    return
  }

  var ldescribe = opts.describe || describe
  if (!opts.StorageCls.isAvailable()) {
    ldescribe = xdescribe
  }

  ldescribe('storage.data.' + opts.StorageCls.name, function () {
    var storage
    /* @todo Rename to record1, add record2, record3 */
    var record = {
      colorCode: 'epobc',
      txid: random.getRandomBuffer(32).toString('hex'),
      oidx: 2,
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
            var newRecord = _.defaults({value: record.value + 1}, record)
            return storage.add(newRecord)
          })
          .asCallback(function (err) {
            expect(err).to.be.instanceof(
              cclib.errors.Storage.ColorData.HaveAnotherValue)
            done()
          })
          .done(_.noop, _.noop)
      })
    })

    describe('#get', function () {
      var record2 = _.cloneDeep(record)
      record2.oidx += 1
      var record3 = _.cloneDeep(record)
      record3.txid = random.getRandomBuffer(32).toString('hex')

      beforeEach(function (done) {
        Promise.all([
          storage.add(record),
          storage.add(record2),
          storage.add(record3)
        ])
        .then(_.noop)
        .done(done, done)
      })

      it('output not exists', function (done) {
        storage.get({txid: random.getRandomBuffer(32).toString('hex')})
          .then(function (data) {
            expect(data).to.deep.equal({})
          })
          .done(done, done)
      })

      it('output exists', function (done) {
        return storage.get({colorCode: record.colorCode, txid: record.txid})
          .then(function (data) {
            var obj = {}
            obj[record.oidx] = {}
            obj[record.oidx][record.colorId] = record.value
            obj[record2.oidx] = {}
            obj[record2.oidx][record2.colorId] = record.value
            expect(data).to.deep.equal(obj)
          })
          .done(done, done)
      })

      it('output exists, specific oidx', function (done) {
        return storage.get({
          colorCode: record.colorCode,
          txid: record.txid,
          oidx: record.oidx
        })
        .then(function (data) {
          var obj = {}
          obj[record.oidx] = {}
          obj[record.oidx][record.colorId] = record.value
          expect(data).to.deep.equal(obj)
        })
        .done(done, done)
      })
    })

    describe('#remove', function () {
      it('add/get/delete/get', function (done) {
        storage.add(record)
          .then(function () {
            return storage.get({
              colorCode: record.colorCode,
              txid: record.txid,
              oidx: record.oidx
            })
          })
          .then(function (data) {
            var obj = {}
            obj[record.oidx] = {}
            obj[record.oidx][record.colorId] = record.value
            expect(data).to.deep.equal(obj)
            return storage.remove({
              colorCode: record.colorCode,
              txid: record.txid
            })
          })
          .then(function () {
            return storage.get({
              colorCode: record.colorCode,
              txid: record.txid
            })
          })
          .then(function (data) {
            expect(data).to.deep.equal({})
          })
          .done(done, done)
      })
    })
  })
}
