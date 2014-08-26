var expect = require('chai').expect

var cclib = require('../src/index')
var OperationalTx = cclib.OperationalTx


describe('OperationalTx', function() {
  var optx

  beforeEach(function() {
    optx = new cclib.OperationalTx()
  })

  it('getTargets', function() {
    expect(optx.getTargets).to.throw(Error)
  })

  it('selectCoins', function() {
    expect(optx.selectCoins).to.throw(Error)
  })

  it('getChangeAddress', function() {
    expect(optx.getChangeAddress).to.throw(Error)
  })

  it('getRequiredFee', function() {
    expect(optx.getRequiredFee).to.throw(Error)
  })

  it('getDustThreshold', function() {
    expect(optx.getDustThreshold).to.throw(Error)
  })

  it('makeComposedTx', function() {
    expect(optx.makeComposedTx()).to.be.instanceof(cclib.ComposedTx)
  })
})
