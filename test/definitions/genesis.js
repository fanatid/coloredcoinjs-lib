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

  it('static fromDesc', () => {
    return expect(Genesis.fromDesc()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('fromTx', () => {
    return expect(Genesis.fromTx()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('runKernel', () => {
    return expect(cdef.runKernel()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('static getAffectingInputs', () => {
    return expect(Genesis.getAffectingInputs()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('static makeComposedTx', () => {
    return expect(Genesis.makeComposedTx()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('static composeGenesisTx', () => {
    return expect(Genesis.composeGenesisTx()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })
})
