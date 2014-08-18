var expect = require('chai').expect

var cclib = require('../src/index')


describe('color.ColorDefinition', function() {
  var colordef

  it('getColorId', function() {
    colordef = new cclib.color.ColorDefinition(1)
    expect(colordef.getColorId()).to.equal(1)
  })
})
