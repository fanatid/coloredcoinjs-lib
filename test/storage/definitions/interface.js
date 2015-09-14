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

  it('#resolve', async () => {
    try {
      await storage.resolve()
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

  it('#clear', async () => {
    try {
      await storage.clear()
      throw new Error()
    } catch (err) {
      expect(err).to.be.instanceof(cclib.errors.NotImplemented)
    }
  })
})
