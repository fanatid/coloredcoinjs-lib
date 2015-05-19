/* global describe, beforeEach, it */
var expect = require('chai').expect

var cclib = require('../../')
var Genesis = cclib.definitions.Genesis

describe('definitions.Genesis', function () {
  var cdef

  beforeEach(function () {
    cdef = new Genesis()
  })

  it('inherits defintions.Interface', function () {
    expect(cdef).to.be.instanceof(cclib.definitions.Interface)
    expect(cdef).to.be.instanceof(Genesis)
  })

  it('static getColorCode', function () {
    var fn = Genesis.getColorCode.bind(Genesis)
    expect(fn).to.throw(cclib.errors.NotImplementedError)
  })

  it('getColorCode', function () {
    var fn = cdef.getColorCode.bind(cdef)
    expect(fn).to.throw(cclib.errors.NotImplementedError)
  })

  it('getColorId', function () {
    expect(cdef.getColorId()).to.equal(-1)
  })

  it('getDesc', function () {
    var fn = cdef.getDesc.bind(cdef)
    expect(fn).to.throw(cclib.errors.NotImplementedError)
  })

  it('static fromDesc', function () {
    var fn = Genesis.fromDesc.bind(Genesis)
    expect(fn).to.throw(cclib.errors.NotImplementedError)
  })

  it('static makeComposedTx', function () {
    var fn = Genesis.makeComposedTx.bind(Genesis)
    expect(fn).to.throw(cclib.errors.NotImplementedError)
  })

  it('static composeGenesisTx', function () {
    var fn = Genesis.composeGenesisTx.bind(Genesis)
    expect(fn).to.throw(cclib.errors.NotImplementedError)
  })
})
