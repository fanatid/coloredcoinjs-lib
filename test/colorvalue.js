var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var colordef = coloredcoinlib.colordef
var colorvalue = coloredcoinlib.colorvalue


describe('colorvalue', function() {
  describe('ColorValue', function() {
    var colorValue

    beforeEach(function() {
      colorValue = new colorvalue.ColorValue({ colordef: colordef.uncoloredMarker })
    })

    it('getColorDefinition', function() {
      expect(colorValue.getColorDefinition()).to.deep.equal(colordef.uncoloredMarker)
    })

    it('getColorID', function() {
      expect(colorValue.getColorID()).to.equal(0)
    })

    it('checkCompatibility return true', function() {
      var colorValue2 = new colorvalue.ColorValue({ colordef: colordef.uncoloredMarker })
      expect(colorValue.checkCompatibility(colorValue2)).to.equal(true)
    })

    it('checkCompatibility return false', function() {
      var colorValue2 = new colorvalue.ColorValue({ colordef: new colordef.ColorDefinition(1) })
      expect(colorValue.checkCompatibility(colorValue2)).to.equal(false)
    })
  })

  describe('AdditiveColorValue', function() {
    var addativeColorValue

    beforeEach(function() {
      addativeColorValue = new colorvalue.AdditiveColorValue({ colordef: colordef.uncoloredMarker, value: 0 })
    })

    it('inherits ColorValue', function() {
      expect(addativeColorValue).to.be.instanceof(colorvalue.ColorValue)
      expect(addativeColorValue).to.be.instanceof(colorvalue.AdditiveColorValue)
    })

    it('getValue', function() {
      expect(addativeColorValue.getValue()).to.equal(0)
    })

    it('add with compatibility', function() {
      var colorValue = new colorvalue.AdditiveColorValue({ colordef: colordef.uncoloredMarker, value: 1 })
      addativeColorValue.add(colorValue)
      expect(addativeColorValue.getValue()).to.equal(1)
    })

    it('add with not compatibility', function() {
      var colorValue = new colorvalue.AdditiveColorValue({ colordef: new colordef.ColorDefinition(1), value: 1 })
      addativeColorValue.add(colorValue)
      expect(addativeColorValue.getValue()).to.equal(0)
    })
  })

  describe('SimpleColorValue', function() {
    var simpleColorValue

    beforeEach(function() {
      simpleColorValue = new colorvalue.SimpleColorValue({ colordef: colordef.uncoloredMarker, value: 0 })
    })

    it('inherits AdditiveColorValue', function() {
      expect(simpleColorValue).to.be.instanceof(colorvalue.AdditiveColorValue)
      expect(simpleColorValue).to.be.instanceof(colorvalue.SimpleColorValue)
    })
  })
})
