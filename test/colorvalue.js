/* global describe, beforeEach, it */
var expect = require('chai').expect

var cclib = require('../')
var errors = cclib.errors
var ColorValue = cclib.ColorValue

describe('ColorValue', function () {
  var genesisCDef = new cclib.definitions.Genesis()
  var uncoloredCDef = new cclib.definitions.Uncolored()
  var cv1

  beforeEach(function () {
    cv1 = new ColorValue(uncoloredCDef, 1)
  })

  it('getColorDefinition', function () {
    expect(cv1.getColorDefinition()).to.deep.equal(uncoloredCDef)
  })

  it('getColorId', function () {
    expect(cv1.getColorId()).to.equal(uncoloredCDef.getColorId())
  })

  it('isUncolored return true', function () {
    expect(cv1.isUncolored()).to.be.true
  })

  it.skip('isUncolored return false', function () {
    var colordef = cclib.EPOBCColorDefinition.fromDesc(
      1, 'epobc:73560ffd916267a70a1233eb63d5d97e79e7eac981a52860df1ac38d2568b3a5:0:274664')
    cv1 = new ColorValue(colordef, 1)
    expect(cv1.isUncolored()).to.be.false
  })

  it('getValue', function () {
    expect(cv1.getValue()).to.equal(1)
  })

  it('clone', function () {
    var cv2 = cv1.clone()
    expect(cv2.getColorDefinition()).to.deep.equal(cv1.getColorDefinition())
    expect(cv2.getValue()).to.deep.equal(cv1.getValue())
  })

  it('checkCompatibility not throw', function () {
    var cv2 = new ColorValue(uncoloredCDef, 0)
    var fn = function () { cv1.checkCompatibility(cv2) }
    expect(fn).to.not.throw(errors.IncompatibilityColorValuesError)
  })

  it('checkCompatibility throw error', function () {
    var cv2 = new ColorValue(genesisCDef, 0)
    var fn = function () { cv1.checkCompatibility(cv2) }
    expect(fn).to.throw(errors.IncompatibilityColorValuesError)
  })

  it('plus with compatibility', function () {
    var cv2 = new ColorValue(uncoloredCDef, 1)
    var cv3 = cv1.plus(cv2)
    expect(cv3.getValue()).to.equal(cv1.getValue() + cv2.getValue())
  })

  it('plus with not compatibility', function () {
    var cv2 = new ColorValue(genesisCDef, 1)
    var fn = function () { cv1.plus(cv2) }
    expect(fn).to.throw(errors.IncompatibilityColorValuesError)
  })

  it('neg', function () {
    expect(cv1.neg().getValue()).to.equal(-1)
  })

  it('minus with compatibility', function () {
    var cv2 = new ColorValue(uncoloredCDef, 1)
    var cv3 = cv1.minus(cv2)
    expect(cv3.getValue()).to.equal(cv1.getValue() - cv2.getValue())
  })

  it('minus with not compatibility', function () {
    var cv2 = new ColorValue(genesisCDef, 1)
    var fn = function () { cv1.minus(cv2) }
    expect(fn).to.throw(errors.IncompatibilityColorValuesError)
  })

  it('sum with compatibility', function () {
    var cv2 = new ColorValue(uncoloredCDef, 1)
    var sum = ColorValue.sum([cv1, cv2]).getValue()
    expect(sum).to.equal(cv1.getValue() + cv2.getValue())
  })

  it('sum with empty colorValues', function () {
    var fn = function () { ColorValue.sum([]) }
    expect(fn).to.throw(Error)
  })

  it('sum with not compatibility', function () {
    var cv2 = new ColorValue(genesisCDef, 1)
    var fn = function () { ColorValue.sum([cv1, cv2]) }
    expect(fn).to.throw(errors.IncompatibilityColorValuesError)
  })
})
