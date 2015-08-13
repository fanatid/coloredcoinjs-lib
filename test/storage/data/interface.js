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

  it('#add', (done) => {
    storage.add()
      .then(() => { throw new Error() })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
  })

  it('#get', function (done) {
    storage.get()
      .then(() => { throw new Error() })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
  })

  it('#remove', function (done) {
    storage.remove()
      .then(() => { throw new Error() })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
  })

  it('#clear', function (done) {
    storage.clear()
      .then(() => { throw new Error() })
      .catch((err) => {
        expect(err).to.be.instanceof(cclib.errors.NotImplemented)
        done()
      })
  })
})
