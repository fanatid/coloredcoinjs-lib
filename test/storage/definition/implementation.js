/* globals Promise:true */
/* global describe, xdescribe, beforeEach, afterEach, it */
var expect = require('chai').expect

var _ = require('lodash')
var Promise = require('bluebird')
var random = require('bitcore').crypto.Random

module.exports = function (opts) {
  var ldescribe = opts.describe || describe
  if (!opts.StorageCls.isAvailable()) {
    ldescribe = xdescribe
  }

  ldescribe('storage.definition.' + opts.StorageCls.name, function () {
    var storage

    beforeEach(function (done) {
      storage = new opts.StorageCls(opts.storageOpts)
      storage.ready.done(done, done)
    })

    afterEach(function (done) {
      storage.clear().done(done, done)
    })

    describe('#resolve', function () {
      it('return null', function (done) {
        storage.resolve('...', false)
          .then(function (record) {
            expect(record).to.be.null
          })
          .done(done, done)
      })

      it('create new record', function (done) {
        var desc = random.getRandomBuffer(5).toString('hex')
        storage.resolve(desc)
          .then(function (record) {
            expect(record).to.deep.equal({id: 1, desc: desc})
          })
          .done(done, done)
      })

      it('resolve exists record', function (done) {
        var colorId
        var desc = random.getRandomBuffer(5).toString('hex')
        storage.resolve(desc)
          .then(function (record) {
            expect(record).to.be.an('object')
            expect(record.id).to.be.a('number')
            expect(record.desc).to.equal(desc)
            colorId = record.id
            return storage.resolve(desc)
          })
          .then(function (record) {
            expect(record).to.deep.equal({id: colorId, desc: desc})
          })
          .done(done, done)
      })
    })

    describe('#get', function () {
      var records

      beforeEach(function (done) {
        Promise.all([
          storage.resolve(random.getRandomBuffer(5).toString('hex')),
          storage.resolve(random.getRandomBuffer(5).toString('hex')),
          storage.resolve(random.getRandomBuffer(5).toString('hex'))
        ])
        .then(function (result) {
          expect(result).to.have.length(3)
          records = result
        })
        .done(done, done)
      })

      it('by id', function (done) {
        storage.get(records[0].id)
          .then(function (record) {
            expect(record).to.deep.equal(records[0])
          })
          .done(done, done)
      })

      it('get all', function (done) {
        storage.get()
          .then(function (result) {
            expect(_.sortBy(result, 'id')).to.deep.equal(_.sortBy(records, 'id'))
          })
          .done(done, done)
      })
    })
  })
}
