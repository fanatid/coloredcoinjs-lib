/* global describe, xdescribe, beforeEach, afterEach, it */
'use strict'

var expect = require('chai').expect

var _ = require('lodash')
var Promise = require('bluebird')
var random = require('bitcore').crypto.Random

module.exports = function (opts) {
  if (opts.StorageCls === undefined) {
    return
  }

  var ldescribe = opts.describe || describe
  if (!opts.StorageCls.isAvailable()) {
    ldescribe = xdescribe
  }

  ldescribe('storage.definitions.' + opts.StorageCls.name, function () {
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
        storage.resolve('...', {autoAdd: false})
          .then(function (data) {
            expect(data).to.deep.equal({record: null, new: null})
          })
          .done(done, done)
      })

      it('create new record', function (done) {
        var desc = random.getRandomBuffer(5).toString('hex')
        storage.resolve(desc)
          .then(function (data) {
            expect(data).to.be.an('object')
            expect(data.record).to.be.an('object')
            expect(data.record.id).to.be.at.least(1)
            expect(data.record.desc).to.equal(desc)
            expect(data.new).to.be.true
          })
          .done(done, done)
      })

      it('resolve exists record', function (done) {
        var colorId
        var desc = random.getRandomBuffer(5).toString('hex')
        storage.resolve(desc)
          .then(function (data) {
            expect(data).to.have.deep.property('record.id').and.to.be.a('Number')
            expect(data).to.have.deep.property('record.desc', desc)
            expect(data).to.have.property('new', true)
            colorId = data.record.id
            return storage.resolve(desc)
          })
          .then(function (data) {
            expect(data).to.deep.equal(
              {record: {id: colorId, desc: desc}, new: false})
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
          records = _.pluck(result, 'record')
        })
        .done(done, done)
      })

      it('by id', function (done) {
        storage.get({id: records[0].id})
          .then(function (data) {
            expect(data).to.deep.equal(records[0])
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
