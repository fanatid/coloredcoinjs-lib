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

    beforeEach(() => {
      storage = new StorageCls(opts.clsOpts)
      return storage.ready
    })

    afterEach(() => {
      return storage.clear()
    })

    describe('#resolve', () => {
      it('return null', async () => {
        let data = await storage.resolve('...', {autoAdd: false})
        expect(data).to.deep.equal({record: null, new: null})
      })

      it('create new record', async () => {
        let desc = getRandomBytes(5).toString('hex')
        let data = await storage.resolve(desc)
        expect(data).to.be.an('object')
        expect(data.record).to.be.an('object')
        expect(data.record.id).to.be.at.least(1)
        expect(data.record.desc).to.equal(desc)
        expect(data.new).to.be.true
      })

      it('resolve exists record', async () => {
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
    })

    describe('#get', () => {
      let records

      beforeEach(async () => {
        let result = await* [
          storage.resolve(getRandomBytes(5).toString('hex')),
          storage.resolve(getRandomBytes(5).toString('hex')),
          storage.resolve(getRandomBytes(5).toString('hex'))
        ]
        expect(result).to.have.length(3)
        records = _.pluck(result, 'record')
      })

      it('by id', async () => {
        let data = await storage.get({id: records[0].id})
        expect(data).to.deep.equal(records[0])
      })

      it('get all', async () => {
        let result = await storage.get()
        expect(_.sortBy(result, 'id')).to.deep.equal(_.sortBy(records, 'id'))
      })
    })

    describe('#remove', () => {
      it('by id', async () => {
        let record = (await storage.resolve(getRandomBytes(5).toString('hex'))).record
        await storage.remove({id: record.id})
        let data = await storage.get({id: record.id})
        expect(data).to.be.null
      })
    })
  })
}
