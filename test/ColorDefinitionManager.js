var expect = require('chai').expect

var cclib = require('../src/index')
var EPOBCColorDefinition = cclib.EPOBCColorDefinition


describe('ColorDefinitionManager', function() {
  var cdManager, cdStorage
  var epobcDesc1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  var epobcDesc2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach(function() {
    cdStorage = new cclib.ColorDefinitionStorage()
    cdManager = new cclib.ColorDefinitionManager(cdStorage)
  })

  afterEach(function() {
    cdStorage.clear()
  })

  describe('getUncolored', function() {
    it('is UncoloredColorDefinition', function() {
      expect(cdManager.getUncolored()).to.be.instanceof(cclib.UncoloredColorDefinition)
    })

    it('colorId is 0', function() {
      expect(cdManager.getUncolored().getColorId()).to.equal(0)
    })
  })

  describe('getGenesis', function() {
    it('is GenesisColorDefinition', function() {
      expect(cdManager.getGenesis()).to.be.instanceof(cclib.GenesisColorDefinition)
    })

    it('colorId is -1', function() {
      expect(cdManager.getGenesis().getColorId()).to.equal(-1)
    })
  })

  describe('getColorDefenitionClsForType', function() {
    it('return null', function() {
      expect(cdManager.getColorDefenitionClsForType('aaa')).to.be.null
    })

    it('return EPOBCColorDefinition constructor', function() {
      expect(cdManager.getColorDefenitionClsForType('epobc')).to.equal(EPOBCColorDefinition)
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
      cdStorage.add(epobcDesc1)
      var result = cdManager.getByColorId(1)
      expect(result).to.deep.equal(EPOBCColorDefinition.fromDesc(1, epobcDesc1))
    })
  })

  describe('resolveByDesc', function() {
    it('record is not null', function() {
      cdStorage.add(epobcDesc1)
      var result = cdManager.resolveByDesc(epobcDesc1)
      expect(result).to.deep.equal(EPOBCColorDefinition.fromDesc(1, epobcDesc1))
    })

    it('record is null, autoAdd is false', function() {
      var result = cdManager.resolveByDesc(epobcDesc1, false)
      expect(result).to.be.null
    })

    it('return uncolored', function() {
      var result = cdManager.resolveByDesc('')
      expect(result).to.deep.equal(cdManager.getUncolored())
    })

    it('add new record', function() {
      var result = cdManager.resolveByDesc(epobcDesc1)
      expect(result).to.deep.equal(EPOBCColorDefinition.fromDesc(1, epobcDesc1))
    })
  })

  describe('getAllColorDefinitions', function() {
    it('return empty Array', function() {
      var result = cdManager.getAllColorDefinitions()
      expect(result).to.deep.equal([])
    })

    it('return 2 items', function() {
      var record1 = cdManager.resolveByDesc(epobcDesc1)
      var record2 = cdManager.resolveByDesc(epobcDesc2)
      var result = cdManager.getAllColorDefinitions()
      expect(result).to.deep.equal([record1, record2])
    })
  })
})
