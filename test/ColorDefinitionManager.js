var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var colordef = coloredcoinlib.colordef
var ColorDefinitionManager = coloredcoinlib.ColorDefinitionManager
var ColorDefinitionStore = coloredcoinlib.store.ColorDefinitionStore


describe('ColorDefinitionManager', function() {
  var cdManager, cdStore
  var epobcScheme1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  var epobcScheme2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach(function() {
    cdStore = new ColorDefinitionStore()
    cdManager = new ColorDefinitionManager(cdStore)
  })

  afterEach(function() {
    cdStore.clear()
  })

  describe('resolveByScheme', function() {
    it('record is not null', function() {
      cdStore.add({ meta: {}, scheme: epobcScheme1 })
      var result = cdManager.resolveByScheme({ scheme: epobcScheme1 })
      expect(result).to.deep.equal(colordef.EPOBCColorDefinition.fromScheme({ colorId: 1 }, epobcScheme1))
    })

    it('record is null, autoAdd is false', function() {
      var result = cdManager.resolveByScheme({ scheme: epobcScheme1, autoAdd: false })
      expect(result).to.be.null
    })

    it('add new record', function() {
      var result = cdManager.resolveByScheme({ scheme: epobcScheme1 })
      expect(result).to.deep.equal(colordef.EPOBCColorDefinition.fromScheme({ colorId: 1 }, epobcScheme1))
    })
  })

  describe('updateMeta', function() {
    it('update', function() {
      cdManager.resolveByScheme({ scheme: epobcScheme1 })
      var epobc = colordef.EPOBCColorDefinition.fromScheme({ colorId:1, meta: {'a': 'b'} }, epobcScheme1)
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
