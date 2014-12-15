var expect = require('chai').expect

var cclib = require('../src/index')
var ColorSet = cclib.ColorSet


describe('ColorSet', function () {
  var cdStorage
  var cdManager
  var colorSet

  beforeEach(function () {
    cdStorage = new cclib.ColorDefinitionStorage()
    cdManager = new cclib.ColorDefinitionManager(cdStorage)
  })

  afterEach(function () {
    cdStorage.clear()
  })

  it('getColorHash', function () {
    var colorDescs = ['', 'epobc:b95323a763fa507110a89ab857af8e949810cf1e67e91104cd64222a04ccd0bb:0:180679']
    colorSet = new ColorSet(cdManager, colorDescs)
    expect(colorSet.getColorHash()).to.equal('6xgXQgnviwX5Lk')
  })

  it('getColorDescs', function () {
    colorSet = new ColorSet(cdManager, [''])
    expect(colorSet.getColorDescs()).to.deep.equal([''])
  })

  it('getColorDefinitions', function () {
    colorSet = new ColorSet(cdManager, [''])
    expect(colorSet.getColorDefinitions()).to.deep.equal([cclib.ColorDefinitionManager.getUncolored()])
  })

  it('getColorIds', function () {
    colorSet = new ColorSet(cdManager, [''])
    expect(colorSet.getColorIds()).to.deep.equal([0])
  })
})
