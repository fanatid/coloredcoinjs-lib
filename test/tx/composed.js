import _ from 'lodash'
import { expect } from 'chai'

import cclib from '../../src'
import { FixedFeeOperationalTx } from '../helpers'

describe('tx.ComposedTx', () => {
  let tx

  beforeEach(() => {
    let optx = new cclib.tx.Operational()
    tx = optx.makeComposedTx()
  })

  it('addInput/addInputs/setInputSequence/getInputs', () => {
    let input = {
      txid: '06a480de0293ce9c2d8c76e15ac3b2f61f5bf7a47d139527ce335bf55b000e8f',
      oidx: 0
    }
    tx.addInput(input)
    tx.addInputs([input, input])
    tx.setInputSequence(0, 33)

    let expected = [_.extend({sequence: 33}, input), input, input]
    expect(tx.getInputs()).to.deep.equal(expected)
  })

  it('setInputSequence throw Error', () => {
    let fn = () => { tx.setInputSequence(0, 33) }
    expect(fn).to.throw(Error)
  })

  it('addOutput/addOutputs/getOutputs', () => {
    let uncolored = cclib.definitions.Manager.getUncolored()
    let cvalue = new cclib.ColorValue(uncolored, _.random(1, 10))
    let ctarget = new cclib.ColorTarget('124902', cvalue)
    tx.addOutput({target: ctarget})
    tx.addOutputs([{script: '11', value: 4}])

    let expected = [
      {script: ctarget.getScript(), value: ctarget.getValue()},
      {script: '11', value: 4}
    ]

    expect(tx.getOutputs()).to.deep.equal(expected)
  })

  it('addOutput throw Error (colored target)', () => {
    let target = {isUncolored: _.constant(false)}
    let fn = () => { tx.addOutput({target: target}) }
    expect(fn).to.throw(Error)
  })

  it('estimateSize', () => {
    let size = tx.estimateSize({inputs: 2, outputs: 3, bytes: 99})
    expect(size).to.equal(507)
  })

  it('estimateRequiredFee less than 1000', () => {
    let optx = new FixedFeeOperationalTx(999)
    tx = optx.makeComposedTx()
    let result = tx.estimateRequiredFee()
    expect(result).to.be.instanceof(cclib.ColorValue)
    expect(result.getValue()).to.equal(1000)
  })

  it('estimateRequiredFee more than 1000', () => {
    let optx = new FixedFeeOperationalTx(1001)
    tx = optx.makeComposedTx()
    let result = tx.estimateRequiredFee()
    expect(result).to.be.instanceof(cclib.ColorValue)
    expect(result.getValue()).to.equal(1001)
  })
})
