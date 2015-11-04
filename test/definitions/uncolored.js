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
    it('fail, wrong color id', () => {
      return expect(Uncolored.fromDesc('', 1)).to.be.rejectedWith(cclib.errors.ColorDefinition.IncorrectColorId)
    })

    it('fail, wrong description', () => {
      return expect(Uncolored.fromDesc('xxx', 0)).to.be.rejectedWith(cclib.errors.ColorDefinition.IncorrectDesc)
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

  it('fromTx', () => {
    return expect(Uncolored.fromTx()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('runKernel', () => {
    return expect(cdef.runKernel()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('static getAffectingInputs', () => {
    return expect(Uncolored.getAffectingInputs()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it.skip('static makeComposedTx', () => {})

  it('static composeGenesisTx', () => {
    return expect(Uncolored.composeGenesisTx()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })
})
