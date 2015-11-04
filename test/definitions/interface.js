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

  it('static fromDesc', () => {
    return expect(Interface.fromDesc()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('static fromTx', () => {
    return expect(Interface.fromTx()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('isGenesis', () => {
    expect(::cdef.isGenesis).to.throw(cclib.errors.NotImplemented)
  })

  it('runKernel', () => {
    return expect(cdef.runKernel()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('static getAffectingInputs', () => {
    return expect(Interface.getAffectingInputs()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('static makeComposedTx', () => {
    return expect(Interface.makeComposedTx()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('static composeGenesisTx', () => {
    return expect(Interface.composeGenesisTx()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })
})
