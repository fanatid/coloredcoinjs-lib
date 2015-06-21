/* global describe, xdescribe, beforeEach, afterEach, it */
'use strict'

var _ = require('lodash')
var expect = require('chai').expect
var Promise = require('bluebird')
var crypto = require('crypto')

var cclib = require('../../../')

module.exports = function (opts) {
  var StorageCls = cclib.storage.data[opts.clsName]
  if (StorageCls === undefined) {
    return
  }

  var ldescribe = opts.describe || describe
  if (!StorageCls.isAvailable()) {
    ldescribe = xdescribe
  }

  ldescribe('storage.data.' + opts.clsName, function () {
    var storage

    var records = _.range(3).map(function () {
      return {
        colorCode: 'epobc',
        txid: crypto.pseudoRandomBytes(32).toString('hex'),
        oidx: 2,
        colorId: 1,
        value: 10
      }
    })
    records[1].txid = records[0].txid
    records[1].oidx += 1

    beforeEach(function (done) {
      storage = new StorageCls(opts.clsOpts)
      storage.ready.done(done, done)
    })

    afterEach(function (done) {
      storage.clear().done(done, done)
    })

    describe('#add', function () {
      it('same output for given color id already exists', function (done) {
        storage.add(records[0])
          .then(function () {
            var newRecord = _.defaults({
              value: records[0].value + 1
            }, records[0])
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
      beforeEach(function (done) {
        Promise.map(records, function (record) {
          return storage.add(record)
        })
        .then(_.noop)
        .done(done, done)
      })

      it('output not exists', function (done) {
        storage.get({txid: crypto.pseudoRandomBytes(32).toString('hex')})
          .then(function (data) {
            expect(data).to.deep.equal({})
          })
          .done(done, done)
      })

      it('output exists', function (done) {
        var opts = {colorCode: records[0].colorCode, txid: records[0].txid}
        return storage.get(opts)
          .then(function (data) {
            var obj = {}
            obj[records[0].oidx] = {}
            obj[records[0].oidx][records[0].colorId] = records[0].value
            obj[records[1].oidx] = {}
            obj[records[1].oidx][records[1].colorId] = records[1].value
            expect(data).to.deep.equal(obj)
          })
          .done(done, done)
      })

      it('output exists, specific oidx', function (done) {
        var opts = {
          colorCode: records[0].colorCode,
          txid: records[0].txid,
          oidx: records[0].oidx
        }
        return storage.get(opts)
          .then(function (data) {
            var obj = {}
            obj[records[0].oidx] = {}
            obj[records[0].oidx][records[0].colorId] = records[0].value
            expect(data).to.deep.equal(obj)
          })
          .done(done, done)
      })
    })

    describe('#remove', function () {
      it('add/get/delete/get', function (done) {
        storage.add(records[0])
          .then(function () {
            var opts = {
              colorCode: records[0].colorCode,
              txid: records[0].txid,
              oidx: records[0].oidx
            }
            return storage.get(opts)
          })
          .then(function (data) {
            var obj = {}
            obj[records[0].oidx] = {}
            obj[records[0].oidx][records[0].colorId] = records[0].value
            expect(data).to.deep.equal(obj)

            var opts = {
              colorCode: records[0].colorCode,
              txid: records[0].txid
            }
            return storage.remove(opts)
          })
          .then(function () {
            var opts = {
              colorCode: records[0].colorCode,
              txid: records[0].txid
            }
            return storage.get(opts)
          })
          .then(function (data) {
            expect(data).to.deep.equal({})
          })
          .done(done, done)
      })
    })
  })
}
