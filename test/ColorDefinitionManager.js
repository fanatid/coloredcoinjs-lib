/* globals Promise:true */
/* global describe, beforeEach, afterEach, it */
var expect = require('chai').expect
var _ = require('lodash')
var Promise = require('bluebird')

var cclib = require('../')
var EPOBCColorDefinition = cclib.EPOBCColorDefinition

describe.only('ColorDefinitionManager', function () {
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

  describe('getColorDefenitionClsForType', function () {
    it('return null', function () {
      var cdcls = cclib.ColorDefinitionManager.getColorDefenitionClsForType('x')
      expect(cdcls).to.be.null
    })

    it('return EPOBCColorDefinition constructor', function () {
      var cdcls = cclib.ColorDefinitionManager.getColorDefenitionClsForType('epobc')
      expect(cdcls).to.equal(EPOBCColorDefinition)
    })
  })

  describe('getByColorId', function () {
    it('return null', function (done) {
      cdManager.getByColorId(10)
        .asCallback(function (err, cdef) {
          expect(err).to.be.null
          expect(cdef).to.be.null
          done()
        })
    })

    it('return uncolred', function (done) {
      cdManager.getByColorId(0)
        .asCallback(function (err, cdef) {
          expect(err).to.be.null
          expect(cdef).to.be.instanceof(cclib.UncoloredColorDefinition)
          done()
        })
    })

    it('return ColorDefinition', function (done) {
      cdStorage.resolve(epobcDesc1, true)
        .then(function (record) {
          return cdManager.getByColorId(record.id)
            .asCallback(function (err, cdef) {
              expect(err).to.be.null
              expect(cdef.getDesc()).to.equal(record.desc)
              expect(cdef.getColorId()).to.equal(record.id)
              done()
            })
        })
    })
  })

  describe('resolveByDesc', function () {
    it('record is not null', function (done) {
      cdStorage.resolve(epobcDesc1, true)
        .then(function (record) {
          return cdManager.resolveByDesc(epobcDesc1)
            .then(function (cdef) {
              expect(cdef.getColorId()).to.equal(record.id)
              expect(cdef.getDesc()).to.equal(record.desc)
            })
        })
        .done(done, done)
    })

    it('record is null, autoAdd is false', function (done) {
      cdManager.resolveByDesc(epobcDesc1, false)
        .then(function (cdef) {
          expect(cdef).to.be.null
        })
        .done(done, done)
    })

    it('return uncolored', function (done) {
      cdManager.resolveByDesc('')
        .then(function (cdef) {
          expect(cdef).to.be.instanceof(cclib.UncoloredColorDefinition)
        })
        .done(done, done)
    })

    it('add new record', function (done) {
      cdManager.resolveByDesc(epobcDesc1)
        .then(function (cdef) {
          expect(cdef.getDesc()).to.equal(epobcDesc1)
        })
        .done(done, done)
    })
  })

  describe('getAllColorDefinitions', function () {
    it('return empty Array', function (done) {
      cdManager.getAllColorDefinitions()
        .asCallback(function (err, cdefs) {
          expect(err).to.be.null
          expect(cdefs).to.deep.equal([])
          done()
        })
    })

    it('return 2 items', function (done) {
      Promise.all([
        cdManager.resolveByDesc(epobcDesc1),
        cdManager.resolveByDesc(epobcDesc2)
      ])
      .then(function () {
        return cdManager.getAllColorDefinitions()
      })
      .asCallback(function (err, cdefs) {
        expect(err).to.be.null
        var result = _.invoke(cdefs, 'getDesc').sort()
        expect(result).to.deep.equal([epobcDesc1, epobcDesc2].sort())
        done()
      })
    })
  })
})
