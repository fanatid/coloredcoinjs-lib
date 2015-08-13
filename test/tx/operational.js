import { pseudoRandomBytes as getRandomBytes } from 'crypto'
import _ from 'lodash'
import { expect } from 'chai'

import cclib from '../../src'

describe('tx.Operational', () => {
  let optx
  let ctarget

  beforeEach(() => {
    optx = new cclib.tx.Operational()
    let cdef = cclib.definitions.Manager.getUncolored()
    let value = _.random(1, 10)
    let cvalue = new cclib.ColorValue(cdef, value)
    let script = getRandomBytes(5).toString('hex')
    ctarget = new cclib.ColorTarget(script, cvalue)
  })

  it('addTarget/addTargets/getTargets', () => {
    expect(optx.getTargets()).to.have.length(0)
    optx.addTarget(ctarget)
    expect(optx.getTargets()).to.have.length(1)
    optx.addTargets([ctarget, ctarget])
    expect(optx.getTargets()).to.have.length(3)
  })

  it('isMonoColor return true', () => {
    expect(optx.isMonoColor()).to.be.true
    optx.addTargets([ctarget, ctarget])
    expect(optx.isMonoColor()).to.be.true
  })

  it('isMonoColor return false', () => {
    let cdef = cclib.definitions.Manager.getGenesis()
    let value = _.random(1, 10)
    let cvalue = new cclib.ColorValue(cdef, value)
    let script = getRandomBytes(5).toString('hex')
    let ctarget2 = new cclib.ColorTarget(script, cvalue)
    optx.addTargets([ctarget, ctarget2])
    expect(optx.isMonoColor()).to.be.false
  })

  it('selectCoins', (done) => {
    optx.selectCoins()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('getChangeAddress', (done) => {
    optx.getChangeAddress()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('getRequiredFee (default fee-per-kilobyte)', () => {
    let result = optx.getRequiredFee(_.random(1, 10000))
    expect(result).to.be.instanceof(cclib.ColorValue)
    expect(result.getColorDefinition().getColorCode()).to.equal('uncolored')
  })

  it('getRequiredFee (certain fee-per-kilobyte)', () => {
    let result = optx.getRequiredFee(_.random(1, 10000), 0)
    expect(result).to.be.instanceof(cclib.ColorValue)
    expect(result.getColorDefinition().getColorCode()).to.equal('uncolored')
    expect(result.getValue()).to.equal(0)
  })

  it('getDustThreshold', () => {
    expect(optx.getDustThreshold()).to.be.instanceof(cclib.ColorValue)
  })

  it('makeComposedTx', () => {
    expect(optx.makeComposedTx()).to.be.instanceof(cclib.tx.Composed)
  })
})
