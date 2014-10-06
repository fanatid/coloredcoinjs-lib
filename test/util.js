var expect = require('chai').expect

var cclib = require('../src/index')
var util = require('../src/util')


describe('util', function() {
  it('number2bitArray', function() {
    var bits = util.number2bitArray(54648432)
    expect(bits).to.deep.equal([0,0,0,0,1,1,1,0,0,1,1,1,1,0,1,1,1,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0])
  })

  it('bitArray2number', function() {
    var bits = [0,0,0,0,1,1,1,0,0,1,1,1,1,0,1,1,1,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0]
    expect(util.bitArray2number(bits)).to.equal(54648432)
  })

  describe('groupTargetsByColor', function() {
    it('throw Error', function() {
      var targets = [{ getColorDefinition: function() {} }]
      var fn = function() { util.groupTargetsByColor(targets, Number) }
      expect(fn).to.throw(Error)
    })

    it('grouped', function() {
      var target1 = {
        getColorDefinition: function() { return new cclib.UncoloredColorDefinition() },
        getColorId: function() { return 0 }
      }
      var target2 = {
        getColorDefinition: function() { return new cclib.UncoloredColorDefinition() },
        getColorId: function() { return 2 }
      }

      var result = util.groupTargetsByColor([target1, target2], cclib.GenesisColorDefinition)
      expect(result).to.deep.equal({ '0': [target1], '2': [target2] })
    })
  })
})
