/* global describe, it */
var expect = require('chai').expect

var cclib = require('../')
var util = cclib.util

/** @todo Move to other files */
describe.skip('util', function () {
  it('number2bitArray', function () {
    var bits = util.number2bitArray(54648432)
    expect(bits).to.deep.equal(
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0])
  })

  it('bitArray2number', function () {
    var bits = [0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0]
    expect(util.bitArray2number(bits)).to.equal(54648432)
  })
})
