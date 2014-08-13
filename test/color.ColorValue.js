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
    cv1 = new ColorValue({ colordef: uncoloredColorDefinition, value: 0 })
  })

  it('getColorDefinition', function() {
    expect(cv1.getColorDefinition()).to.deep.equal(uncoloredColorDefinition)
  })

  it('getColorId', function() {
    expect(cv1.getColorId()).to.equal(uncoloredColorDefinition.getColorId())
  })

  it('checkCompatibility return true', function() {
    cv2 = new ColorValue({ colordef: uncoloredColorDefinition, value: 0 })
    expect(cv1.checkCompatibility(cv2)).to.equal(true)
  })

  it('checkCompatibility return false', function() {
    cv2 = new ColorValue({ colordef: new ColorDefinition({ colorId: 1 }), value: 0 })
    expect(cv1.checkCompatibility(cv2)).to.equal(false)
  })

  it('getValue', function() {
    expect(cv1.getValue()).to.equal(0)
  })

  it('add with compatibility', function() {
    cv2 = new ColorValue({ colordef: uncoloredColorDefinition, value: 1 })
    cv1.add(cv2, function(error, result) {
      expect(error).to.be.null
      expect(result.getValue()).to.equal(1)
    })
  })

  it('add with not compatibility', function() {
    cv2 = new ColorValue({ colordef: new ColorDefinition({ colorId: 1 }), value: 1 })
    cv1.add(cv2, function(error, result) {
      expect(error).to.be.instanceof(Error)
      expect(result).to.be.undefined
    })
  })
})
