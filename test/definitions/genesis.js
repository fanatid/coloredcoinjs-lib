import { expect } from 'chai'

import cclib from '../../src'
let Genesis = cclib.definitions.Genesis

describe('definitions.Genesis', () => {
  let cdef

  beforeEach(() => {
    cdef = new Genesis()
  })

  it('inherits defintions.Interface', () => {
    expect(cdef).to.be.instanceof(cclib.definitions.Interface)
    expect(cdef).to.be.instanceof(Genesis)
  })

  it('static getColorCode', () => {
    expect(Genesis.getColorCode).to.throw(cclib.errors.NotImplemented)
  })

  it('getColorCode', () => {
    expect(::cdef.getColorCode).to.throw(cclib.errors.NotImplemented)
  })

  it('getColorId', () => {
    expect(cdef.getColorId()).to.equal(-1)
  })

  it('getDesc', () => {
    expect(::cdef.getDesc).to.throw(cclib.errors.NotImplemented)
  })

  it('static fromDesc', async () => {
    try {
      await Genesis.fromDesc()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('fromTx', async () => {
    try {
      await Genesis.fromTx()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
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
      await Genesis.getAffectingInputs()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('static makeComposedTx', async () => {
    try {
      await Genesis.makeComposedTx()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('static composeGenesisTx', async () => {
    try {
      await Genesis.composeGenesisTx()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })
})
