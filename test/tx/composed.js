/* global describe, beforeEach, it */
var _ = require('lodash')
var expect = require('chai').expect

var cclib = require('../../')
var FixedFeeOperationalTx = require('../helpers').FixedFeeOperationalTx

describe('tx.Composed', function () {
  var tx

  beforeEach(function () {
    var optx = new cclib.tx.Operational()
    tx = optx.makeComposedTx()
  })

  it('addInput/addInputs/setInputSequence/getInputs', function () {
    var input = {
      txid: '06a480de0293ce9c2d8c76e15ac3b2f61f5bf7a47d139527ce335bf55b000e8f',
      vout: 0
    }
    tx.addInput(input)
    tx.addInputs([input, input])
    tx.setInputSequence(0, 33)

    var expected = [_.extend({sequence: 33}, input), input, input]
    expect(tx.getInputs()).to.deep.equal(expected)
  })

  it('setInputSequence throw Error', function () {
    var fn = function () { tx.setInputSequence(0, 33) }
    expect(fn).to.throw(Error)
  })

  it('addOutput/addOutputs/getOutputs', function () {
    var uncolored = new cclib.definitions.Uncolored()
    var cvalue = new cclib.ColorValue(uncolored, _.random(1, 10))
    var ctarget = new cclib.ColorTarget('124902', cvalue)
    tx.addOutput({target: ctarget})
    tx.addOutputs([{script: '11', value: 4}])

    var expected = [
      {script: ctarget.getScript(), value: ctarget.getValue()},
      {script: '11', value: 4}
    ]

    expect(tx.getOutputs()).to.deep.equal(expected)
  })

  it('addOutput throw Error (colored target)', function () {
    var target = {isUncolored: _.constant(false)}
    var fn = function () { tx.addOutput({target: target}) }
    expect(fn).to.throw(Error)
  })

  it('estimateSize', function () {
    var size = tx.estimateSize({inputs: 2, outputs: 3, bytes: 99})
    expect(size).to.equal(507)
  })

  it('estimateRequiredFee less than 1000', function () {
    var optx = new FixedFeeOperationalTx(999)
    tx = optx.makeComposedTx()
    var result = tx.estimateRequiredFee()
    expect(result).to.be.instanceof(cclib.ColorValue)
    expect(result.getValue()).to.equal(1000)
  })

  it('estimateRequiredFee more than 1000', function () {
    var optx = new FixedFeeOperationalTx(1001)
    tx = optx.makeComposedTx()
    var result = tx.estimateRequiredFee()
    expect(result).to.be.instanceof(cclib.ColorValue)
    expect(result.getValue()).to.equal(1001)
  })
})
