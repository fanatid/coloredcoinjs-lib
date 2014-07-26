var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var colordef = coloredcoinlib.colordef
var ColorValue = coloredcoinlib.ColorValue


describe('ColorValue', function() {
  var cv1, cv2

  beforeEach(function() {
    cv1 = new ColorValue({ colordef: colordef.uncoloredMarker, value: 0 })
  })

  it('getColorDefinition', function() {
    expect(cv1.getColorDefinition()).to.deep.equal(colordef.uncoloredMarker)
  })

  it('getColorId', function() {
    expect(cv1.getColorId()).to.equal(colordef.uncoloredMarker.getColorId())
  })

  it('checkCompatibility return true', function() {
    cv2 = new ColorValue({ colordef: colordef.uncoloredMarker, value: 0 })
    expect(cv1.checkCompatibility(cv2)).to.equal(true)
  })

  it('checkCompatibility return false', function() {
    cv2 = new ColorValue({ colordef: new colordef.ColorDefinition(1), value: 0 })
    expect(cv1.checkCompatibility(cv2)).to.equal(false)
  })

  it('getValue', function() {
    expect(cv1.getValue()).to.equal(0)
  })

  it('add with compatibility', function() {
    cv2 = new ColorValue({ colordef: colordef.uncoloredMarker, value: 1 })
    cv1.add(cv2)
    expect(cv1.getValue()).to.equal(1)
  })

  it('add with not compatibility', function() {
    cv2 = new ColorValue({ colordef: new colordef.ColorDefinition(1), value: 1 })
    cv1.add(cv2)
    expect(cv1.getValue()).to.equal(0)
  })
})
