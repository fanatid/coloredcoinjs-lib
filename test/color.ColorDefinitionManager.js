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
      var result = cdManager.getByColorId({ colorId: 10 })
      expect(result).to.be.null
    })

    it('return uncolred', function() {
      var result = cdManager.getByColorId({ colorId: 0 })
      expect(result).to.deep.equal(cdManager.getUncolored())
    })

    it('return ColorDefinition', function() {
      cdStorage.add({ meta: {}, scheme: epobcScheme1 })
      var result = cdManager.getByColorId({ colorId: 1 })
      expect(result).to.deep.equal(EPOBCColorDefinition.fromScheme({ colorId: 1 }, epobcScheme1))
    })
  })

  describe('resolveByScheme', function() {
    it('record is not null', function() {
      cdStorage.add({ meta: {}, scheme: epobcScheme1 })
      var result = cdManager.resolveByScheme({ scheme: epobcScheme1 })
      expect(result).to.deep.equal(EPOBCColorDefinition.fromScheme({ colorId: 1 }, epobcScheme1))
    })

    it('record is null, autoAdd is false', function() {
      var result = cdManager.resolveByScheme({ scheme: epobcScheme1, autoAdd: false })
      expect(result).to.be.null
    })

    it('return uncolored', function() {
      var result = cdManager.resolveByScheme({ scheme: '' })
      expect(result).to.deep.equal(cdManager.getUncolored())
    })

    it('add new record', function() {
      var result = cdManager.resolveByScheme({ scheme: epobcScheme1 })
      expect(result).to.deep.equal(EPOBCColorDefinition.fromScheme({ colorId: 1 }, epobcScheme1))
    })
  })

  describe('updateMeta', function() {
    it('update', function() {
      cdManager.resolveByScheme({ scheme: epobcScheme1 })
      var epobc = EPOBCColorDefinition.fromScheme({ colorId:1, meta: {'a': 'b'} }, epobcScheme1)
      cdManager.updateMeta(epobc)
      var result = cdManager.resolveByScheme({ scheme: epobcScheme1 })
      expect(result).to.deep.equal(epobc)
    })
  })

  describe('getAllColorDefinitions', function() {
    it('return empty Array', function() {
      var result = cdManager.getAllColorDefinitions()
      expect(result).to.deep.equal([])
    })

    it('return 2 items', function() {
      var record1 = cdManager.resolveByScheme({ scheme: epobcScheme1 })
      var record2 = cdManager.resolveByScheme({ scheme: epobcScheme2 })
      var result = cdManager.getAllColorDefinitions()
      expect(result).to.deep.equal([record1, record2])
    })
  })
})
