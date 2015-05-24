/* global describe, beforeEach, it */
var _ = require('lodash')
var expect = require('chai').expect

var cclib = require('../../')

describe('tx.Operational', function () {
  var optx

  beforeEach(function () {
    optx = new cclib.tx.Operational()
  })

  it.skip('addTarget', function () {})
  it.skip('addTargets', function () {})
  it.skip('getTargets', function () {})
  it.skip('isMonoColor', function () {})

  it('selectCoins', function (done) {
    optx.selectCoins()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
        done()
      })
      .done(_.noop, _.noop)
  })

  it('getChangeAddress', function (done) {
    optx.selectCoins()
      .asCallback(function (err) {
        expect(err).to.be.instanceof(cclib.errors.NotImplementedError)
        done()
      })
      .done(_.noop, _.noop)
  })

  it.skip('getRequiredFee', function () {
    expect(optx.getRequiredFee).to.throw(Error)
  })

  it.skip('getDustThreshold', function () {
    expect(optx.getDustThreshold).to.throw(Error)
  })

  it('makeComposedTx', function () {
    expect(optx.makeComposedTx()).to.be.instanceof(cclib.tx.Composed)
  })
})
