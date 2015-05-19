/* global describe, beforeEach, it */
var expect = require('chai').expect

var cclib = require('../../')
var Interface = cclib.definitions.Interface

describe('definitions.Interface', function () {
  var cdef

  beforeEach(function () {
    cdef = new Interface(1)
  })

  it('static getColorCode', function () {
    expect(Interface.getColorCode).to.throw(cclib.errors.NotImplementedError)
  })

  it('getColorCode', function () {
    var fn = cdef.getColorCode.bind(cdef)
    expect(fn).to.throw(cclib.errors.NotImplementedError)
  })

  it('colorId', function () {
    expect(cdef.getColorId()).to.equal(1)
  })

  it('desc', function () {
    expect(cdef.getDesc).to.throw(cclib.errors.NotImplementedError)
  })

  it('static fromDesc', function () {
    expect(Interface.fromDesc).to.throw(
      cclib.errors.NotImplementedError)
  })

  it('static makeComposedTx', function () {
    expect(Interface.makeComposedTx).to.throw(
      cclib.errors.NotImplementedError)
  })

  it('static composeGenesisTx', function () {
    expect(Interface.composeGenesisTx).to.throw(
      cclib.errors.NotImplementedError)
  })
})
