/* globals Promise:true */
/* global describe, beforeEach, it */
var expect = require('chai').expect
var _ = require('lodash')
var events = require('events')
var Promise = require('bluebird')

var cclib = require('../../')

describe('ColorDefinitionManager', function () {
  var cdmanager
  var cdstorage
  var epobcDesc1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  var epobcDesc2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach(function (done) {
    cdstorage = new cclib.storage.definitions.Memory()
    cdstorage.ready.done(done, done)
    cdmanager = new cclib.definitions.Manager(cdstorage)
  })

  it('inherit EventEmitter', function () {
    expect(cdmanager).to.be.instanceof(cclib.definitions.Manager)
    expect(cdmanager).to.be.instanceof(events.EventEmitter)
  })

  it('getUncolored', function () {
    var cdef = cclib.definitions.Manager.getUncolored()
    expect(cdef).to.be.instanceof(cclib.definitions.Uncolored)
    expect(cdef).to.deep.equal(new cclib.definitions.Uncolored())
  })

  it('getGenesis', function () {
    var cdef = cclib.definitions.Manager.getGenesis()
    expect(cdef).to.be.instanceof(cclib.definitions.Genesis)
    expect(cdef).to.deep.equal(new cclib.definitions.Genesis())
  })

  describe('ColorDefinitions: register, get all, get by code', function () {
    it('already registered', function () {
      var fn = function () {
        cclib.definitions.Manager.registerColorDefinitionClass(
          cclib.definitions.EPOBC)
      }
      expect(fn).to.throw(cclib.errors.ColorDefinition.AlreadyRegistered)
    })

    it('return null', function () {
      var cdcls = cclib.definitions.Manager.getColorDefinitionClass('x')
      expect(cdcls).to.be.null
    })

    it('return registered color definition', function () {
      var cdcls = cclib.definitions.Manager.getColorDefinitionClass('epobc')
      expect(cdcls).to.equal(cclib.definitions.EPOBC)
    })

    it('return array of registered color definitions', function () {
      var classes = cclib.definitions.Manager.getColorDefinitionClasses()
      expect(classes).to.deep.equal([cclib.definitions.EPOBC])
    })
  })

  describe('resolve', function () {
    it('add new record', function (done) {
      cdmanager.resolve(epobcDesc1)
        .then(function (cdef) {
          expect(cdef.getDesc()).to.equal(epobcDesc1)
        })
        .done(done, done)
    })

    it('generate event on adding new defintion', function (done) {
      var deferred = Promise.defer()

      cdmanager.on('new', function (cdef) {
        Promise.try(function () {
          expect(cdef).to.be.instanceof(cclib.definitions.Interface)
          expect(cdef.getDesc()).to.equal(epobcDesc1)
        })
        .done(function () { deferred.resolve() },
              function (err) { deferred.reject(err) })
      })

      cdmanager.resolve(epobcDesc1)
        .then(function (cdef) {
          expect(cdef.getDesc()).to.equal(epobcDesc1)
          return deferred.promise
        })
        .finally(function () {
          cdmanager.removeAllListeners()
        })
        .done(done, done)
    })

    it('record is not null', function (done) {
      cdstorage.resolve(epobcDesc1)
        .then(function (data) {
          return cdmanager.resolve(data.record.desc)
            .then(function (cdef) {
              expect(cdef.getColorId()).to.equal(data.record.id)
              expect(cdef.getDesc()).to.equal(data.record.desc)
            })
        })
        .done(done, done)
    })

    it('record is null, autoAdd is false', function (done) {
      cdmanager.resolve(epobcDesc1, {autoAdd: false})
        .then(function (cdef) {
          expect(cdef).to.be.null
        })
        .done(done, done)
    })

    it('return uncolored', function (done) {
      cdmanager.resolve('')
        .then(function (cdef) {
          expect(cdef).to.be.instanceof(cclib.definitions.Uncolored)
        })
        .done(done, done)
    })
  })

  describe('get', function () {
    it('return null', function (done) {
      cdmanager.get({id: 10})
        .then(function (cdef) {
          expect(cdef).to.be.null
        })
        .done(done, done)
    })

    it('return uncolred', function (done) {
      cdmanager.get({id: 0})
        .then(function (cdef) {
          expect(cdef).to.be.instanceof(cclib.definitions.Uncolored)
        })
        .done(done, done)
    })

    it('return ColorDefinition', function (done) {
      cdstorage.resolve(epobcDesc1)
        .then(function (data) {
          return cdmanager.get({id: data.record.id})
            .then(function (cdef) {
              expect(cdef.getDesc()).to.equal(data.record.desc)
              expect(cdef.getColorId()).to.equal(data.record.id)
            })
        })
        .done(done, done)
    })

    it('return empty Array', function (done) {
      cdmanager.get()
        .then(function (cdefs) {
          expect(cdefs).to.deep.equal([])
        })
        .done(done, done)
    })

    it('return 2 items', function (done) {
      Promise.all([
        cdmanager.resolve(epobcDesc1),
        cdmanager.resolve(epobcDesc2)
      ])
      .then(function () {
        return cdmanager.get()
      })
      .then(function (cdefs) {
        var result = _.invoke(cdefs, 'getDesc').sort()
        expect(result).to.deep.equal([epobcDesc1, epobcDesc2].sort())
      })
      .done(done, done)
    })
  })
})
