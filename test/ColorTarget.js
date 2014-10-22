var expect = require('chai').expect

var cclib = require('../src/index')
var ColorTarget = cclib.ColorTarget


describe('ColorTarget', function() {
  var cdStorage, cdManager, uncolored
  var cv1
  var ct1, ct2

  beforeEach(function() {
    cdStorage = new cclib.ColorDefinitionStorage()
    cdManager = new cclib.ColorDefinitionManager(cdStorage)
    uncolored = cdManager.getUncolored()
    cv1 = new cclib.ColorValue(uncolored, 10)
    ct1 = new ColorTarget('0102', cv1)
  })

  afterEach(function() {
    cdStorage.clear()
  })

  it('getScript', function() {
    expect(ct1.getScript()).to.equal('0102')
  })

  it('getColorValue', function() {
    expect(ct1.getColorValue()).to.deep.equal(cv1)
  })

  it('getValue', function() {
    expect(ct1.getValue()).to.equal(10)
  })

  it('getColorDefinition', function() {
    expect(ct1.getColorDefinition()).to.deep.equal(uncolored)
  })

  it('getColorId', function() {
    expect(ct1.getColorId()).to.equal(uncolored.getColorId())
  })

  it('isUncolored', function() {
    expect(ct1.isUncolored()).to.be.true
  })

  it('sum', function() {
    cv2 = new cclib.ColorValue(uncolored, 15)
    ct2 = new ColorTarget('', cv2)
    var tcv = new cclib.ColorValue(uncolored, 25)
    expect(ColorTarget.sum([ct1, ct2])).to.deep.equal(tcv)
  })
})
