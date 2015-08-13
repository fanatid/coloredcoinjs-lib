import { expect } from 'chai'

import cclib from '../../src'
let Uncolored = cclib.definitions.Uncolored

describe('definitions.Uncolored', () => {
  var cdef

  beforeEach(() => {
    cdef = new Uncolored()
  })

  it('inherits defintions.Interface', () => {
    expect(cdef).to.be.instanceof(cclib.definitions.Interface)
    expect(cdef).to.be.instanceof(Uncolored)
  })

  it('static getColoreCode', () => {
    expect(Uncolored.getColorCode()).to.equal('uncolored')
  })

  it('getColorCode', () => {
    expect(cdef.getColorCode()).to.equal('uncolored')
  })

  it('getColorId', () => {
    expect(cdef.getColorId()).to.equal(0)
  })

  it('getDesc', () => {
    expect(cdef.getDesc()).to.equal('')
  })

  describe('fromDesc', () => {
    it('fail, wrong color id', (done) => {
      Uncolored.fromDesc('', 1)
        .then(() => { throw new Error('h1') })
        .catch((err) => {
          expect(err).to.be.instanceof(
            cclib.errors.ColorDefinition.IncorrectColorId)
        })
        .then(done, done)
    })

    it('fail, wrong description', (done) => {
      Uncolored.fromDesc('xxx', 0)
        .then(() => { throw new Error('h1') })
        .catch((err) => {
          expect(err).to.be.instanceof(
            cclib.errors.ColorDefinition.IncorrectDesc)
        })
        .then(done, done)
    })

    it('successful #1', (done) => {
      Uncolored.fromDesc('', 0)
        .then((cdef) => {
          expect(cdef.getColorId()).to.equal(0)
        })
        .then(done, done)
    })

    it('successful #2', (done) => {
      Uncolored.fromDesc('')
        .then((cdef) => {
          expect(cdef.getColorId()).to.equal(0)
        })
        .then(done, done)
    })
  })

  it('fromTx', (done) => {
    Uncolored.fromTx()
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
    Uncolored.getAffectingInputs()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it.skip('static makeComposedTx', (done) => {})

  it('static composeGenesisTx', (done) => {
    Uncolored.composeGenesisTx()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })
})
