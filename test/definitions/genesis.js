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

  it('static fromDesc', (done) => {
    Genesis.fromDesc()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('fromTx', (done) => {
    Genesis.fromTx()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('runKernel', (done) => {
    cdef.runKernel()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('static getAffectingInputs', (done) => {
    Genesis.getAffectingInputs()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('static makeComposedTx', (done) => {
    Genesis.makeComposedTx()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('static composeGenesisTx', (done) => {
    Genesis.composeGenesisTx()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })
})
