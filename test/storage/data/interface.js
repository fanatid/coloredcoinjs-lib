import { expect } from 'chai'

import cclib from '../../../src'

describe('storage.data.Interface', () => {
  let storage

  beforeEach(() => {
    storage = new cclib.storage.data.Interface()
  })

  it('isAvailable', () => {
    expect(cclib.storage.data.Interface.isAvailable()).to.be.false
  })

  it('#add', () => {
    return expect(storage.add()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('#get', () => {
    return expect(storage.get()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('#remove', () => {
    return expect(storage.remove()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })

  it('#clear', () => {
    return expect(storage.clear()).to.be.rejectedWith(cclib.errors.NotImplemented)
  })
})
