var expect = require('chai').expect

var cclib = require('../src/index')
var UncoloredColorDefinition = cclib.UncoloredColorDefinition


describe('UncoloredColorDefinition', function () {
  var colordef

  beforeEach(function () {
    colordef = new UncoloredColorDefinition()
  })

  it('inherits ColorDefinition', function () {
    expect(colordef).to.be.instanceof(cclib.ColorDefinition)
    expect(colordef).to.be.instanceof(UncoloredColorDefinition)
  })

  it('getColorType', function () {
    expect(colordef.getColorType()).to.equal('uncolored')
  })

  describe('fromDesc', function () {
    it('throw error (wrong colorId)', function () {
      function fn() { UncoloredColorDefinition.fromDesc(1, '') }
      expect(fn).to.throw(Error)
    })

    it('throw error (bad desc)', function () {
      function fn() { UncoloredColorDefinition.fromDesc(0, '1') }
      expect(fn).to.throw(Error)
    })

    it('create new UncoloredColorDefinition', function () {
      var colordef2 = UncoloredColorDefinition.fromDesc(colordef.getColorId(), '')
      expect(colordef2).to.deep.equal(colordef)
    })
  })
})
