var expect = require('chai').expect

var cclib = require('../src/index')


describe('color.ColorDefinition', function() {
  var colordef

  it('getColorId', function() {
    colordef = new cclib.color.ColorDefinition({ colorId: 1 })
    expect(colordef.getColorId()).to.equal(1)
  })

  it('getMeta', function() {
    var meta = { label: 'GOLD' }
    colordef = new cclib.color.ColorDefinition({ colorId: 1, meta: meta })
    expect(colordef.getMeta()).to.deep.equal(meta)
  })
})
