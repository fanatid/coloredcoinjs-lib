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
    it('fail, wrong color id', async () => {
      try {
        await Uncolored.fromDesc('', 1)
        throw new Error()
      } catch (err) {
        expect(err).to.be.instanceof(
          cclib.errors.ColorDefinition.IncorrectColorId)
      }
    })

    it('fail, wrong description', async () => {
      try {
        await Uncolored.fromDesc('xxx', 0)
        throw new Error()
      } catch (err) {
        expect(err).to.be.instanceof(
          cclib.errors.ColorDefinition.IncorrectDesc)
      }
    })

    it('successful #1', async () => {
      let cdef = await Uncolored.fromDesc('', 0)
      expect(cdef.getColorId()).to.equal(0)
    })

    it('successful #2', async () => {
      let cdef = await Uncolored.fromDesc('')
      expect(cdef.getColorId()).to.equal(0)
    })
  })

  it('fromTx', async () => {
    try {
      await Uncolored.fromTx()
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
      await Uncolored.getAffectingInputs()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it.skip('static makeComposedTx', () => {})

  it('static composeGenesisTx', async () => {
    try {
      await Uncolored.composeGenesisTx()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })
})
