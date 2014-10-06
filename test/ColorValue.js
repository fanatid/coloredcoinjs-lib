var expect = require('chai').expect

var cclib = require('../src/index')
var ColorDefinition = cclib.ColorDefinition
var ColorValue = cclib.ColorValue


describe('ColorValue', function() {
  var cdStorage = new cclib.ColorDefinitionStorage() // not need clear, cdManager use only uncolored
  var cdManager = new cclib.ColorDefinitionManager(cdStorage)
  var uncoloredColorDefinition = cdManager.getUncolored()
  var cv1, cv2

  beforeEach(function() {
    cv1 = new ColorValue(uncoloredColorDefinition, 0)
  })

  it('getColorDefinition', function() {
    expect(cv1.getColorDefinition()).to.deep.equal(uncoloredColorDefinition)
  })

  it('getColorId', function() {
    expect(cv1.getColorId()).to.equal(uncoloredColorDefinition.getColorId())
  })

  it('isUncolored return true', function() {
    cv1 = new ColorValue(uncoloredColorDefinition, 0)
    expect(cv1.isUncolored()).to.be.true
  })

  it('isUncolored return false', function() {
    var colordef = cdManager.resolveByDesc('epobc:73560ffd916267a70a1233eb63d5d97e79e7eac981a52860df1ac38d2568b3a5:0:274664')
    cv1 = new ColorValue(colordef, 1)
    expect(cv1.isUncolored()).to.be.false
  })

  it('getValue', function() {
    expect(cv1.getValue()).to.equal(0)
  })

  it('clone', function() {
    cv2 = cv1.clone()
    expect(cv2.getColorDefinition()).to.deep.equal(cv1.getColorDefinition())
    expect(cv2.getValue()).to.deep.equal(cv1.getValue())
  })

  it('checkCompatibility not throw', function() {
    cv2 = new ColorValue(uncoloredColorDefinition, 0)
    var fn = function() { cv1.checkCompatibility(cv2) }
    expect(fn).to.not.throw(TypeError)
  })

  it('checkCompatibility throw error', function() {
    cv2 = new ColorValue(new ColorDefinition(1), 0)
    var fn = function() { cv1.checkCompatibility(cv2) }
    expect(fn).to.throw(TypeError)
  })

  it('plus with compatibility', function() {
    cv2 = new ColorValue(uncoloredColorDefinition, 1)
    cv2 = cv1.plus(cv2)
    expect(cv2.getValue()).to.equal(1)
  })

  it('plus with not compatibility', function() {
    cv2 = new ColorValue(new ColorDefinition(1), 1)
    var fn = function() { cv1.plus(cv2) }
    expect(fn).to.throw(TypeError)
  })

  it('neg', function() {
    cv1 = new ColorValue(uncoloredColorDefinition, 10)
    expect(cv1.neg().getValue()).to.equal(-10)
  })

  it('minus with compatibility', function() {
    cv2 = new ColorValue(uncoloredColorDefinition, 1)
    cv2 = cv1.minus(cv2)
    expect(cv2.getValue()).to.equal(-1)
  })

  it('minus with not compatibility', function() {
    cv2 = new ColorValue(new ColorDefinition(1), 1)
    var fn = function() { cv1.minus(cv2) }
    expect(fn).to.throw(TypeError)
  })

  it('sum with compatibility', function() {
    cv2 = new ColorValue(uncoloredColorDefinition, 1)
    expect(ColorValue.sum([cv1, cv2]).getValue()).to.equal(1)
  })

  it('sum with empty colorValues', function() {
    var fn = function() { ColorValue.sum([]) }
    expect(fn).to.throw(Error)
  })

  it('sum with not compatibility', function() {
    cv2 = new ColorValue(new ColorDefinition(1), 1)
    var fn = function() { ColorValue.sum([cv1, cv2]) }
    expect(fn).to.throw(TypeError)
  })
})
