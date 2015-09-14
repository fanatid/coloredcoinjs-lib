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

  it('#add', async () => {
    try {
      await storage.add()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('#get', async () => {
    try {
      await storage.get()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('#remove', async () => {
    try {
      await storage.remove()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })

  it('#clear', async () => {
    try {
      await storage.clear()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })
})
