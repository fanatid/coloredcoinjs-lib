import { expect } from 'chai'

import cclib from '../src'

describe('ColorSet', () => {
  let cdef = new cclib.definitions.Uncolored()
  let cdstorage
  let cdmanager

  beforeEach((done) => {
    cdstorage = new cclib.storage.definitions.Memory()
    cdstorage.ready.then(done, done)
    cdmanager = new cclib.definitions.Manager(cdstorage)
  })

  afterEach((done) => {
    cdstorage.clear().then(done, done)
  })

  it('getColorHash', () => {
    let cdescs = [
      '',
      'epobc:b95323a763fa507110a89ab857af8e949810cf1e67e91104cd64222a04ccd0bb:0:180679'
    ]
    let cset = new cclib.ColorSet(cdmanager, cdescs)
    expect(cset.getColorHash()).to.deep.equal('6xgXQgnviwX5Lk')
  })

  it('getColorDescs', () => {
    let cset = new cclib.ColorSet(cdmanager, [cdef.getDesc()])
    expect(cset.getColorDescs()).to.deep.equal([cdef.getDesc()])
  })

  it('getColorDefinitions', (done) => {
    Promise.resolve()
      .then(async () => {
        let cset = new cclib.ColorSet(cdmanager, [cdef.getDesc()])
        await cset.ready
        let cdefs = await cset.getColorDefinitions()
        expect(cdefs).to.deep.equal([cdef])
      })
      .then(done, done)
  })

  it('getColorIds', (done) => {
    Promise.resolve()
      .then(async () => {
        let cset = new cclib.ColorSet(cdmanager, [cdef.getDesc()])
        await cset.ready
        let cids = await cset.getColorIds()
        expect(cids).to.deep.equal([cdef.getColorId()])
      })
      .then(done, done)
  })
})
