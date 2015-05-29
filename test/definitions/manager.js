/* globals Promise:true */
/* global describe, beforeEach, afterEach, it */
var expect = require('chai').expect
var _ = require('lodash')
var events = require('events')
var Promise = require('bluebird')

var cclib = require('../../')

describe('ColorDefinitionManager', function () {
  var cdManager
  var cdStorage
  var epobcDesc1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  var epobcDesc2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach(function (done) {
    cdStorage = new cclib.storage.definitions.Memory()
    cdStorage.ready.done(done, done)
    cdManager = new cclib.definitions.Manager(cdStorage)
  })

  afterEach(function (done) {
    cdStorage.clear().done(done, done)
  })

  it('inherit EventEmitter', function () {
    expect(cdManager).to.be.instanceof(cclib.definitions.Manager)
    expect(cdManager).to.be.instanceof(events.EventEmitter)
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
      cdManager.resolve(epobcDesc1)
        .then(function (cdef) {
          expect(cdef.getDesc()).to.equal(epobcDesc1)
        })
        .done(done, done)
    })

    it('generate event on adding new defintion', function (done) {
      cdManager.on('new', function (cdef) {
        expect(cdef).to.be.instanceof(cclib.definitions.Interface)
        expect(cdef.getDesc()).to.equal(epobcDesc1)
        done()
      })

      cdManager.resolve(epobcDesc1)
        .then(function (cdef) {
          expect(cdef.getDesc()).to.equal(epobcDesc1)
        })
        .done(_.noop, done)
    })

    it('record is not null', function (done) {
      cdStorage.resolve(epobcDesc1)
        .then(function (data) {
          return cdManager.resolve(data.record.desc)
            .then(function (cdef) {
              expect(cdef.getColorId()).to.equal(data.record.id)
              expect(cdef.getDesc()).to.equal(data.record.desc)
            })
        })
        .done(done, done)
    })

    it('record is null, autoAdd is false', function (done) {
      cdManager.resolve(epobcDesc1, {autoAdd: false})
        .then(function (cdef) {
          expect(cdef).to.be.null
        })
        .done(done, done)
    })

    it('return uncolored', function (done) {
      cdManager.resolve('')
        .then(function (cdef) {
          expect(cdef).to.be.instanceof(cclib.definitions.Uncolored)
        })
        .done(done, done)
    })
  })

  describe('get', function () {
    it('return null', function (done) {
      cdManager.get({id: 10})
        .then(function (cdef) {
          expect(cdef).to.be.null
        })
        .done(done, done)
    })

    it('return uncolred', function (done) {
      cdManager.get({id: 0})
        .then(function (cdef) {
          expect(cdef).to.be.instanceof(cclib.definitions.Uncolored)
        })
        .done(done, done)
    })

    it('return ColorDefinition', function (done) {
      cdStorage.resolve(epobcDesc1)
        .then(function (data) {
          return cdManager.get({id: data.record.id})
            .then(function (cdef) {
              expect(cdef.getDesc()).to.equal(data.record.desc)
              expect(cdef.getColorId()).to.equal(data.record.id)
            })
        })
        .done(done, done)
    })

    it('return empty Array', function (done) {
      cdManager.get()
        .then(function (cdefs) {
          expect(cdefs).to.deep.equal([])
        })
        .done(done, done)
    })

    it('return 2 items', function (done) {
      Promise.all([
        cdManager.resolve(epobcDesc1),
        cdManager.resolve(epobcDesc2)
      ])
      .then(function () {
        return cdManager.get()
      })
      .then(function (cdefs) {
        var result = _.invoke(cdefs, 'getDesc').sort()
        expect(result).to.deep.equal([epobcDesc1, epobcDesc2].sort())
      })
      .done(done, done)
    })
  })
})
