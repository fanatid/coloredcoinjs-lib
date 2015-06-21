/* global describe, beforeEach, it */
'use strict'

var _ = require('lodash')
var expect = require('chai').expect
var crypto = require('crypto')

var cclib = require('../')

describe('ColorTarget', function () {
  var cdef = new cclib.definitions.Uncolored()
  var script = crypto.pseudoRandomBytes(5).toString('hex')
  var value = _.random(1, 10)
  var cvalue
  var ctarget

  beforeEach(function () {
    cvalue = new cclib.ColorValue(cdef, value)
    ctarget = new cclib.ColorTarget(script, cvalue)
  })

  it('getScript', function () {
    expect(ctarget.getScript()).to.equal(script)
  })

  it('getColorValue', function () {
    expect(ctarget.getColorValue()).to.deep.equal(cvalue)
  })

  it('getValue', function () {
    expect(ctarget.getValue()).to.equal(value)
  })

  it('getColorDefinition', function () {
    expect(ctarget.getColorDefinition()).to.deep.equal(cdef)
  })

  it('getColorId', function () {
    expect(ctarget.getColorId()).to.equal(cdef.getColorId())
  })

  it('is uncolored target?', function () {
    expect(ctarget.isUncolored()).to.equal(cdef.getColorCode() === 'uncolored')
  })

  it('sum', function () {
    var ovalue = _.random(1, 10)
    var ocvalue = new cclib.ColorValue(cdef, ovalue)
    var oscript = crypto.pseudoRandomBytes(5).toString('hex')
    var octarget = new cclib.ColorTarget(oscript, ocvalue)

    var result = cvalue.plus(ocvalue)
    expect(cclib.ColorTarget.sum([ctarget, octarget])).to.deep.equal(result)
  })

  describe('groupByColorId', function () {
    it('given array of targets haven\'t TargetCls instance', function () {
      var targets = [{
        getColorDefinition: _.constant(new cclib.definitions.Genesis()),
        isUncolored: _.constant(false)
      }]
      var fn = function () {
        cclib.ColorTarget.groupByColorId(targets, cclib.definitions.EPOBC)
      }
      expect(fn).to.throw(Error)
    })

    it('grouped', function () {
      var uncoloredCDef = new cclib.definitions.Uncolored()
      var genesisCDef = new cclib.definitions.Genesis()

      var target1 = {
        _id: _.uniqueId(),
        getColorDefinition: _.constant(uncoloredCDef),
        getColorId: _.constant(uncoloredCDef.getColorId()),
        isUncolored: _.constant(true)
      }
      var target2 = {
        _id: _.uniqueId(),
        getColorDefinition: _.constant(genesisCDef),
        getColorId: _.constant(genesisCDef.getColorId()),
        isUncolored: _.constant(false)
      }

      var expected = {}
      expected[uncoloredCDef.getColorId()] = [target1]
      expected[genesisCDef.getColorId()] = [target2]

      var result = cclib.ColorTarget.groupByColorId(
        [target1, target2], cclib.definitions.Genesis)

      expect(result).to.deep.equal(expected)
    })
  })
})
