import { expect } from 'chai'

import cclib from '../../src'
let Interface = cclib.definitions.Interface

describe('definitions.Interface', () => {
  var cdef

  beforeEach(() => {
    cdef = new Interface(1)
  })

  it('static getColorCode', () => {
    expect(Interface.getColorCode).to.throw(cclib.errors.NotImplemented)
  })

  it('getColorCode', () => {
    let fn = cdef.getColorCode.bind(cdef)
    expect(fn).to.throw(cclib.errors.NotImplemented)
  })

  it('colorId', () => {
    expect(cdef.getColorId()).to.equal(1)
  })

  it('desc', () => {
    expect(::cdef.getDesc).to.throw(cclib.errors.NotImplemented)
  })

  it('static fromDesc', async () => {
    try {
      await Interface.fromDesc()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('static fromTx', async () => {
    try {
      await Interface.fromTx()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('isGenesis', () => {
    expect(::cdef.isGenesis).to.throw(cclib.errors.NotImplemented)
  })

  it('runKernel', async () => {
    try {
      await cdef.runKernel()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('static getAffectingInputs', async () => {
    try {
      await Interface.getAffectingInputs()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('static makeComposedTx', async () => {
    try {
      await Interface.makeComposedTx()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('static composeGenesisTx', async () => {
    try {
      await Interface.composeGenesisTx()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })
})
