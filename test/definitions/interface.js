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

  it('static fromDesc', (done) => {
    Interface.fromDesc()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('static fromTx', (done) => {
    Interface.fromTx()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('isGenesis', () => {
    expect(::cdef.isGenesis).to.throw(cclib.errors.NotImplemented)
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
    Interface.getAffectingInputs()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('static makeComposedTx', (done) => {
    Interface.makeComposedTx()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('static composeGenesisTx', (done) => {
    Interface.composeGenesisTx()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })
})
