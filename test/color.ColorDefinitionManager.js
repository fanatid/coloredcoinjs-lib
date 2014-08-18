var expect = require('chai').expect

var cclib = require('../src/index')
var ColorDefinition = cclib.color.ColorDefinition
var EPOBCColorDefinition = cclib.color.EPOBCColorDefinition


describe('color.ColorDefinitionManager', function() {
  var cdManager, cdStorage
  var epobcScheme1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  var epobcScheme2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach(function() {
    cdStorage = new cclib.storage.ColorDefinitionStorage()
    cdManager = new cclib.color.ColorDefinitionManager(cdStorage)
  })

  afterEach(function() {
    cdStorage.clear()
  })

  describe('getUncolored', function() {
    it('is ColorDefinition', function() {
      expect(cdManager.getUncolored()).to.be.instanceof(ColorDefinition)
    })

    it('colorId is 0', function() {
      expect(cdManager.getUncolored().getColorId()).to.equal(0)
    })
  })

  describe('getByColorId', function() {
    it('return null', function() {
      var result = cdManager.getByColorId(10)
      expect(result).to.be.null
    })

    it('return uncolred', function() {
      var result = cdManager.getByColorId(0)
      expect(result).to.deep.equal(cdManager.getUncolored())
    })

    it('return ColorDefinition', function() {
      cdStorage.add(epobcScheme1)
      var result = cdManager.getByColorId(1)
      expect(result).to.deep.equal(EPOBCColorDefinition.fromScheme(1, epobcScheme1))
    })
  })

  describe('resolveByScheme', function() {
    it('record is not null', function() {
      cdStorage.add(epobcScheme1)
      var result = cdManager.resolveByScheme(epobcScheme1)
      expect(result).to.deep.equal(EPOBCColorDefinition.fromScheme(1, epobcScheme1))
    })

    it('record is null, autoAdd is false', function() {
      var result = cdManager.resolveByScheme(epobcScheme1, false)
      expect(result).to.be.null
    })

    it('return uncolored', function() {
      var result = cdManager.resolveByScheme('')
      expect(result).to.deep.equal(cdManager.getUncolored())
    })

    it('add new record', function() {
      var result = cdManager.resolveByScheme(epobcScheme1)
      expect(result).to.deep.equal(EPOBCColorDefinition.fromScheme(1, epobcScheme1))
    })
  })

  describe('getAllColorDefinitions', function() {
    it('return empty Array', function() {
      var result = cdManager.getAllColorDefinitions()
      expect(result).to.deep.equal([])
    })

    it('return 2 items', function() {
      var record1 = cdManager.resolveByScheme(epobcScheme1)
      var record2 = cdManager.resolveByScheme(epobcScheme2)
      var result = cdManager.getAllColorDefinitions()
      expect(result).to.deep.equal([record1, record2])
    })
  })
})
