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

  it('#resolve', (done) => {
    storage.resolve()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('#get', function (done) {
    storage.get()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })

  it('#clear', function (done) {
    storage.clear()
      .then(() => { throw new Error('h1') })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
      })
      .then(done, done)
  })
})
