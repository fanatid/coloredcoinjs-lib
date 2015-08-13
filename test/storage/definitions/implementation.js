import { expect } from 'chai'
import _ from 'lodash'
import { pseudoRandomBytes as getRandomBytes } from 'crypto'

import cclib from '../../../src'

module.exports = (opts) => {
  let StorageCls = cclib.storage.definitions[opts.clsName]
  if (StorageCls === undefined) {
    return
  }

  let ldescribe = opts.describe || describe
  if (!StorageCls.isAvailable()) {
    ldescribe = xdescribe
  }

  ldescribe('storage.definitions.' + opts.clsName, () => {
    let storage

    beforeEach((done) => {
      storage = new StorageCls(opts.clsOpts)
      storage.ready.then(done, done)
    })

    afterEach((done) => {
      storage.clear().then(done, done)
    })

    describe('#resolve', () => {
      it('return null', (done) => {
        Promise.resolve()
          .then(async () => {
            let data = await storage.resolve('...', {autoAdd: false})
            expect(data).to.deep.equal({record: null, new: null})
          })
          .then(done, done)
      })

      it('create new record', (done) => {
        Promise.resolve()
          .then(async () => {
            let desc = getRandomBytes(5).toString('hex')
            let data = await storage.resolve(desc)
            expect(data).to.be.an('object')
            expect(data.record).to.be.an('object')
            expect(data.record.id).to.be.at.least(1)
            expect(data.record.desc).to.equal(desc)
            expect(data.new).to.be.true
          })
          .then(done, done)
      })

      it('resolve exists record', (done) => {
        Promise.resolve()
          .then(async () => {
            let desc = getRandomBytes(5).toString('hex')
            let data = await storage.resolve(desc)
            expect(data).to.have.deep.property('record.id').and.to.be.a('Number')
            expect(data).to.have.deep.property('record.desc', desc)
            expect(data).to.have.property('new', true)

            let colorId = data.record.id
            data = await storage.resolve(desc)
            expect(data).to.deep.equal(
              {record: {id: colorId, desc: desc}, new: false})
          })
          .then(done, done)
      })
    })

    describe('#get', () => {
      let records

      beforeEach((done) => {
        Promise.resolve()
          .then(async () => {
            let result = await* [
              storage.resolve(getRandomBytes(5).toString('hex')),
              storage.resolve(getRandomBytes(5).toString('hex')),
              storage.resolve(getRandomBytes(5).toString('hex'))
            ]
            expect(result).to.have.length(3)
            records = _.pluck(result, 'record')
          })
          .then(done, done)
      })

      it('by id', (done) => {
        Promise.resolve()
          .then(async () => {
            let data = await storage.get({id: records[0].id})
            expect(data).to.deep.equal(records[0])
          })
          .then(done, done)
      })

      it('get all', (done) => {
        Promise.resolve()
          .then(async () => {
            let result = await storage.get()
            expect(_.sortBy(result, 'id')).to.deep.equal(_.sortBy(records, 'id'))
          })
          .then(done, done)
      })
    })
  })
}
