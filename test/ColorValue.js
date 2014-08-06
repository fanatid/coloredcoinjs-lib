var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var colordef = coloredcoinlib.colordef
var ColorDefinitionManager = coloredcoinlib.ColorDefinitionManager
var ColorValue = coloredcoinlib.ColorValue
var store = coloredcoinlib.store


describe('ColorValue', function() {
  var cdStore = new store.ColorDefinitionStore() // not need clear, cdManager use only uncolored
  var cdManager = new ColorDefinitionManager(cdStore)
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
    cv2 = new ColorValue({ colordef: new colordef.ColorDefinition({ colorId: 1 }), value: 0 })
    expect(cv1.checkCompatibility(cv2)).to.equal(false)
  })

  it('getValue', function() {
    expect(cv1.getValue()).to.equal(0)
  })

  it('add with compatibility', function() {
    cv2 = new ColorValue({ colordef: uncoloredColorDefinition, value: 1 })
    cv1.add(cv2)
    expect(cv1.getValue()).to.equal(1)
  })

  it('add with not compatibility', function() {
    cv2 = new ColorValue({ colordef: new colordef.ColorDefinition({ colorId: 1 }), value: 1 })
    cv1.add(cv2)
    expect(cv1.getValue()).to.equal(0)
  })
})
