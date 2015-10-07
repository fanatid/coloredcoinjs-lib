import { expect } from 'chai'

import cclib from '../src'

describe('ColorSet', () => {
  let cdef = new cclib.definitions.Uncolored()
  let cdefStorage
  let cdataStorage
  let cdefManager

  beforeEach(() => {
    cdefStorage = new cclib.storage.definitions.Memory()
    cdataStorage = new cclib.storage.data.Memory()
    cdefManager = new cclib.definitions.Manager(cdefStorage, cdataStorage)
    return cdefStorage.ready
  })

  afterEach(() => {
    return cdefStorage.clear()
  })

  it('getColorHash', () => {
    let cdescs = [
      '',
      'epobc:b95323a763fa507110a89ab857af8e949810cf1e67e91104cd64222a04ccd0bb:0:180679'
    ]
    let cset = new cclib.ColorSet(cdefManager, cdescs)
    expect(cset.getColorHash()).to.deep.equal('6xgXQgnviwX5Lk')
  })

  it('getColorDescs', () => {
    let cset = new cclib.ColorSet(cdefManager, [cdef.getDesc()])
    expect(cset.getColorDescs()).to.deep.equal([cdef.getDesc()])
  })

  it('getColorDefinitions', async () => {
    let cset = new cclib.ColorSet(cdefManager, [cdef.getDesc()])
    await cset.ready
    let cdefs = await cset.getColorDefinitions()
    expect(cdefs).to.deep.equal([cdef])
  })

  it('getColorIds', async () => {
    let cset = new cclib.ColorSet(cdefManager, [cdef.getDesc()])
    await cset.ready
    let cids = await cset.getColorIds()
    expect(cids).to.deep.equal([cdef.getColorId()])
  })
})
