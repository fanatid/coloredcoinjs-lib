var expect = require('chai').expect

var cclib = require('../src/index')


describe('ColorDefinition', function() {
  var colordef

  beforeEach(function() {
    colordef = new cclib.ColorDefinition(1)
  })

  it('getColorId', function() {
    expect(colordef.getColorId()).to.equal(1)
  })

  it('getColorType', function() {
    expect(colordef.getColorType).to.throw(Error)
  })
})
