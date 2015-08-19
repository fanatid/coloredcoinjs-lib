import { expect } from 'chai'
import _ from 'lodash'
import { pseudoRandomBytes as getRandomBytes } from 'crypto'

import cclib from '../../../src'

export default function (opts) {
  let StorageCls = cclib.storage.data[opts.clsName]
  if (StorageCls === undefined) {
    return
  }

  let ldescribe = opts.describe || describe
  if (!StorageCls.isAvailable()) {
    ldescribe = xdescribe
  }

  ldescribe('storage.data.' + opts.clsName, () => {
    let storage

    let records = _.times(3).map(() => {
      return {
        colorCode: 'epobc',
        txId: getRandomBytes(32).toString('hex'),
        outIndex: 2,
        colorId: 1,
        value: 10
      }
    })
    records[1].txId = records[0].txId
    records[1].outIndex += 1

    beforeEach((done) => {
      storage = new StorageCls(opts.clsOpts)
      storage.ready.then(done, done)
    })

    afterEach((done) => {
      storage.clear().then(done, done)
    })

    describe('#add', () => {
      it('same output for given color id already exists', (done) => {
        Promise.resolve()
          .then(async () => {
            await storage.add(records[0])

            let newRecord = _.defaults({
              value: records[0].value + 1
            }, records[0])
            try {
              await storage.add(newRecord)
              throw new Error('h1')
            } catch (err) {
              expect(err).to.be.instanceof(
                cclib.errors.Storage.ColorData.HaveAnotherValue)
            }
          })
          .then(done, done)
      })
    })

    describe('#get', () => {
      beforeEach((done) => {
        Promise.resolve()
          .then(async () => {
            await* records.map((record) => {
              return storage.add(record)
            })
          })
          .then(done, done)
      })

      it('output not exists', (done) => {
        Promise.resolve()
          .then(async () => {
            let txId = getRandomBytes(32).toString('hex')
            let data = await storage.get({txId: txId})
            expect(Array.from(data.keys())).to.have.length(0)
          })
          .then(done, done)
      })

      it('output exists', (done) => {
        Promise.resolve()
          .then(async () => {
            let opts = {colorCode: records[0].colorCode, txId: records[0].txId}
            let data = await storage.get(opts)
            expect(Array.from(data.keys())).to.have.length(2)
            expect(Array.from(data.get(records[0].outIndex).keys())).to.have.length(1)
            expect(data.get(records[0].outIndex).get(records[0].colorId)).to.equal(records[0].value)
            expect(Array.from(data.get(records[1].outIndex).keys())).to.have.length(1)
            expect(data.get(records[1].outIndex).get(records[1].colorId)).to.equal(records[1].value)
          })
          .then(done, done)
      })

      it('output exists, specific outIndex', (done) => {
        Promise.resolve()
          .then(async () => {
            let opts = {
              colorCode: records[0].colorCode,
              txId: records[0].txId,
              outIndex: records[0].outIndex
            }
            let data = await storage.get(opts)
            expect(Array.from(data.keys())).to.have.length(1)
            expect(Array.from(data.get(records[0].outIndex).keys())).to.have.length(1)
            expect(data.get(records[0].outIndex).get(records[0].colorId)).to.equal(records[0].value)
          })
          .then(done, done)
      })
    })

    describe('#remove', () => {
      it('add/get/delete/get', (done) => {
        Promise.resolve()
          .then(async () => {
            await storage.add(records[0])

            let opts = {
              colorCode: records[0].colorCode,
              txId: records[0].txId,
              outIndex: records[0].outIndex
            }
            let data = await storage.get(opts)
            expect(Array.from(data.keys())).to.have.length(1)
            expect(Array.from(data.get(records[0].outIndex).keys())).to.have.length(1)
            expect(data.get(records[0].outIndex).get(records[0].colorId)).to.equal(records[0].value)

            opts = {
              colorCode: records[0].colorCode,
              txId: records[0].txId
            }
            await storage.remove(opts)

            opts = {
              colorCode: records[0].colorCode,
              txId: records[0].txId
            }
            data = await storage.get(opts)
            expect(Array.from(data.keys())).to.have.length(0)
          })
          .then(done, done)
      })
    })
  })
}
