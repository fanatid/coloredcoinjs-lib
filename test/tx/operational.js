/* global describe, beforeEach, it */
'use strict'

var _ = require('lodash')
var expect = require('chai').expect
var crypto = require('crypto')

var cclib = require('../../')

describe('tx.Operational', function () {
  var optx
  var ctarget

  beforeEach(function () {
    optx = new cclib.tx.Operational()
    var cdef = new cclib.definitions.Uncolored()
    var value = _.random(1, 10)
    var cvalue = new cclib.ColorValue(cdef, value)
    var script = crypto.pseudoRandomBytes(5).toString('hex')
    ctarget = new cclib.ColorTarget(script, cvalue)
  })

  it('addTarget/addTargets/getTargets', function () {
    expect(optx.getTargets()).to.have.length(0)
    optx.addTarget(ctarget)
    expect(optx.getTargets()).to.have.length(1)
    optx.addTargets([ctarget, ctarget])
    expect(optx.getTargets()).to.have.length(3)
  })

  it('isMonoColor return true', function () {
    expect(optx.isMonoColor()).to.be.true
    optx.addTargets([ctarget, ctarget])
    expect(optx.isMonoColor()).to.be.true
  })

  it('isMonoColor return false', function () {
    var cdef = new cclib.definitions.Genesis()
    var value = _.random(1, 10)
    var cvalue = new cclib.ColorValue(cdef, value)
    var script = crypto.pseudoRandomBytes(5).toString('hex')
    var ctarget2 = new cclib.ColorTarget(script, cvalue)
    optx.addTargets([ctarget, ctarget2])
    expect(optx.isMonoColor()).to.be.false
  })

  it('selectCoins', function (done) {
    optx.selectCoins()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('getChangeAddress', function (done) {
    optx.getChangeAddress()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('getRequiredFee (default fee-per-kilobyte)', function () {
    var result = optx.getRequiredFee(_.random(1, 10000))
    expect(result).to.be.instanceof(cclib.ColorValue)
    expect(result.getColorDefinition().getColorCode()).to.equal('uncolored')
  })

  it('getRequiredFee (certain fee-per-kilobyte)', function () {
    var result = optx.getRequiredFee(_.random(1, 10000), 0)
    expect(result).to.be.instanceof(cclib.ColorValue)
    expect(result.getColorDefinition().getColorCode()).to.equal('uncolored')
    expect(result.getValue()).to.equal(0)
  })

  it('getDustThreshold', function () {
    expect(optx.getDustThreshold()).to.be.instanceof(cclib.ColorValue)
  })

  it('makeComposedTx', function () {
    expect(optx.makeComposedTx()).to.be.instanceof(cclib.tx.Composed)
  })
})
