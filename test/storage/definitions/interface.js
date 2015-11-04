import { expect } from 'chai'

import cclib from '../../../src'

describe('storage.definitions.Interface', () => {
  let storage

  beforeEach(() => {
    storage = new cclib.storage.definitions.Interface()
  })

  it('isAvailable', () => {
    expect(cclib.storage.definitions.Interface.isAvailable()).to.be.false
  })

  it('#resolve', () => {
    return expect(storage.resolve()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('#get', () => {
    return expect(storage.get()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('#clear', () => {
    return expect(storage.clear()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })
})
