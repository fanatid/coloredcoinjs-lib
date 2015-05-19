/* globals Promise:true */
/* global describe, beforeEach, afterEach, it */
var expect = require('chai').expect
var _ = require('lodash')
var Promise = require('bluebird')

var cclib = require('../../')
var EPOBCColorDefinition = cclib.definitions.EPOBC

describe.skip('ColorDefinitionManager', function () {
  var cdManager
  var cdStorage
  var epobcDesc1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  var epobcDesc2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach(function (done) {
    cdStorage = new cclib.storage.definitions.Memory()
    cdStorage.ready.done(done, done)
    cdManager = new cclib.ColorDefinitionManager(cdStorage)
  })

  afterEach(function (done) {
    cdStorage.clear().done(done, done)
  })

  describe('getUncolored', function () {
    it('is UncoloredColorDefinition', function () {
      var cdef = cclib.ColorDefinitionManager.getUncolored()
      expect(cdef).to.be.instanceof(cclib.UncoloredColorDefinition)
    })

    it('colorId is 0', function () {
      var cdef = cclib.ColorDefinitionManager.getUncolored()
      expect(cdef.getColorId()).to.equal(0)
    })
  })

  describe('getGenesis', function () {
    it('is GenesisColorDefinition', function () {
      var cdef = cclib.ColorDefinitionManager.getGenesis()
      expect(cdef).to.be.instanceof(cclib.GenesisColorDefinition)
    })

    it('colorId is -1', function () {
      var cdef = cclib.ColorDefinitionManager.getGenesis()
      expect(cdef.getColorId()).to.equal(-1)
    })
  })

  describe('getColorDefenitionClsForCode', function () {
    it('return null', function () {
      var cdcls = cclib.ColorDefinitionManager.getColorDefenitionClsForCode('x')
      expect(cdcls).to.be.null
    })

    it('return EPOBCColorDefinition constructor', function () {
      var cdcls = cclib.ColorDefinitionManager.getColorDefenitionClsForCode('epobc')
      expect(cdcls).to.equal(EPOBCColorDefinition)
    })
  })

  describe('resolve', function () {
    it('record is not null', function (done) {
      cdStorage.resolve(epobcDesc1)
        .then(function (record) {
          return cdManager.resolve(record.desc)
            .then(function (cdef) {
              expect(cdef.getColorId()).to.equal(record.id)
              expect(cdef.getDesc()).to.equal(record.desc)
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
          expect(cdef).to.be.instanceof(cclib.UncoloredColorDefinition)
        })
        .done(done, done)
    })

    it('add new record', function (done) {
      cdManager.resolve(epobcDesc1)
        .then(function (cdef) {
          expect(cdef.getDesc()).to.equal(epobcDesc1)
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
          expect(cdef).to.be.instanceof(cclib.UncoloredColorDefinition)
        })
        .done(done, done)
    })

    it('return ColorDefinition', function (done) {
      cdStorage.resolve(epobcDesc1)
        .then(function (record) {
          return cdManager.get({id: record.id})
            .then(function (cdef) {
              expect(cdef.getDesc()).to.equal(record.desc)
              expect(cdef.getColorId()).to.equal(record.id)
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
