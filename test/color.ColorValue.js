var expect = require('chai').expect

var cclib = require('../src/index')
var ColorDefinition = cclib.color.ColorDefinition
var ColorValue = cclib.color.ColorValue


describe('color.ColorValue', function() {
  var cdStorage = new cclib.storage.ColorDefinitionStorage() // not need clear, cdManager use only uncolored
  var cdManager = new cclib.color.ColorDefinitionManager(cdStorage)
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

  it('getValue', function() {
    expect(cv1.getValue()).to.equal(0)
  })

  it('add with compatibility', function() {
    cv2 = new ColorValue(uncoloredColorDefinition, 1)
    cv2 = cv1.plus(cv2)
    expect(cv2.getValue()).to.equal(1)
  })

  it('add with not compatibility', function() {
    cv2 = new ColorValue(new ColorDefinition(1), 1)
    var fn = function() { cv1.plus(cv2) }
    expect(fn).to.throw(TypeError)
  })
})
