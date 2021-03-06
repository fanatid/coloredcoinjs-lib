import _ from 'lodash'
import bitcore from 'bitcore-lib'
import { pseudoRandomBytes as getRandomBytes } from 'crypto'
import { expect } from 'chai'

import cclib from '../src'
let EPOBC = cclib.definitions.EPOBC

import helpers from './helpers'

describe('ColorData', () => {
  let tx1
  let tx2
  let tx3

  let cdefStorage
  let cdataStorage
  let cdefManager
  let cdata

  beforeEach(() => {
    tx1 = new bitcore.Transaction()
    tx2 = new bitcore.Transaction()
    tx3 = new bitcore.Transaction()

    cdefStorage = new cclib.storage.definitions.Memory()
    // cdataStorage = new cclib.storage.data.PostgreSQL(require('./config/postgresql.json'))
    cdataStorage = new cclib.storage.data.Memory()

    cdefManager = new cclib.definitions.Manager(cdefStorage, cdataStorage)
    cdata = new cclib.ColorData(cdataStorage, cdefManager)

    return Promise.all([cdefManager.ready, cdata.ready])
  })

  describe('getTxColorValues', () => {
    it('not a color tx', async () => {
      helpers.tx.addInput(tx1, new Buffer(32), 0, 0xffffffff)
      helpers.tx.addOutput(tx1, _.random(1, 1000))

      let getTxFn = helpers.getTxFnStub([])
      let result = await cdata.getTxColorValues(tx1, null, EPOBC, getTxFn)
      expect(result).to.be.an('object')
      expect(result.inputs).to.be.instanceof(Map).and.to.have.property('size', 0)
      expect(result.outputs).to.be.instanceof(Map).and.to.have.property('size', 0)
    })

    it('coinbase tx', async () => {
      helpers.tx.addInput(tx1, new Buffer(helpers.ZERO_HASH, 'hex'), 0xffffffff, 0xffffffff)
      helpers.tx.addOutput(tx1, 50 * 1e8 + _.random(1e5, 1e6))

      let getTxFn = helpers.getTxFnStub([])
      let result = await cdata.getTxColorValues(tx1, null, EPOBC, getTxFn)
      expect(result).to.be.an('object')
      expect(result.inputs).to.be.instanceof(Map).and.to.have.property('size', 0)
      expect(result.outputs).to.be.instanceof(Map).and.to.have.property('size', 0)
    })

    it('genesis tx', async () => {
      helpers.tx.addInput(tx1, new Buffer(32), 0, 37 | (2 << 6))
      helpers.tx.addOutput(tx1, 11)

      let getTxFn = helpers.getTxFnStub([])
      let result = await cdata.getTxColorValues(tx1, null, EPOBC, getTxFn)
      expect(result).to.be.an('object')

      expect(result.inputs).to.be.instanceof(Map).and.to.have.property('size', 0)

      expect(result.outputs).to.be.instanceof(Map).and.to.have.property('size', 1)
      let [colorId, outputs] = Array.from(result.outputs.entries())[0]
      expect(outputs).to.be.an('array').and.to.have.length(1)
      let output = outputs[0]
      expect(output).to.be.instanceof(cclib.ColorValue)
      expect(output.getColorDefinition().getColorId()).to.equal(colorId)
      expect(output.getValue()).to.equal(7)
    })

    it('transfer tx', async () => {
      helpers.tx.addInput(tx1, new Buffer(32), 0, 37 | (2 << 6))
      helpers.tx.addOutput(tx1, 11)

      helpers.tx.addInput(tx2, new Buffer(32), 0, 0xffffffff)
      helpers.tx.addOutput(tx2, 100)

      helpers.tx.addInput(tx3, tx1.id, 0, 51 | (2 << 6))
      helpers.tx.addInput(tx3, tx2.id, 0, 0xffffffff)
      helpers.tx.addOutput(tx3, 10)

      let getTxFn = helpers.getTxFnStub([tx1, tx2])
      let result = await cdata.getTxColorValues(tx3, [0], EPOBC, getTxFn)
      expect(result).to.be.an('object')

      expect(result.inputs).to.be.instanceof(Map).and.to.have.property('size', 1)
      let [colorId1, inputs] = Array.from(result.inputs.entries())[0]
      expect(inputs).to.be.an('array').and.to.have.length(2)
      expect(inputs[0]).to.be.instanceof(cclib.ColorValue)
      expect(inputs[0].getColorDefinition().getColorId()).to.equal(colorId1)
      expect(inputs[0].getValue()).to.equal(7)
      expect(inputs[1]).to.be.null

      expect(result.outputs).to.be.instanceof(Map).and.to.have.property('size', 1)
      let [colorId2, outputs] = Array.from(result.outputs.entries())[0]
      expect(outputs).to.be.an('array').and.to.have.length(1)
      expect(outputs[0]).to.be.instanceof(cclib.ColorValue)
      expect(outputs[0].getColorDefinition().getColorId()).to.equal(colorId2)
      expect(outputs[0].getValue()).to.equal(6)
    })
  })

  describe('getOutColorValues', () => {
    it('tranfer tx from 2 genesis tx', async () => {
      helpers.tx.addInput(tx1, new Buffer(32), 0, 37 | (3 << 6))
      helpers.tx.addOutput(tx1, 18)

      helpers.tx.addInput(tx2, new Buffer(32), 0, 37 | (3 << 6))
      helpers.tx.addOutput(tx2, 28)

      helpers.tx.addInput(tx3, tx1.id, 0, 51 | (3 << 6))
      helpers.tx.addInput(tx3, tx2.id, 0, 0)
      helpers.tx.addOutput(tx3, 13)
      helpers.tx.addOutput(tx3, 15)
      helpers.tx.addOutput(tx3, 18)

      let getTxFn = helpers.getTxFnStub([tx1, tx2])

      let result = await cdata.getOutColorValues(tx3, null, EPOBC, getTxFn)
      expect(result).to.be.instanceof(Map).and.to.have.property('size', 2)
      let cvs = Array.from(result.values())
      expect(cvs[0]).to.have.length(3)
      expect(cvs[0][0]).to.be.instanceof(cclib.ColorValue)
      expect(cvs[0][0].getColorDefinition()._genesis.txId).to.equal(tx1.id)
      expect(cvs[0][0].getValue()).to.equal(5)
      expect(cvs[0][0].getColorId()).to.equal(Array.from(result.keys())[0])
      expect(cvs[0][1]).to.be.null
      expect(cvs[0][2]).to.be.null
      expect(cvs[1]).to.have.length(3)
      expect(cvs[1][0]).to.be.null
      expect(cvs[1][1]).to.be.null
      expect(cvs[1][2]).to.be.instanceof(cclib.ColorValue)
      expect(cvs[1][2].getColorDefinition()._genesis.txId).to.equal(tx2.id)
      expect(cvs[1][2].getValue()).to.equal(10)
      expect(cvs[1][2].getColorId()).to.equal(Array.from(result.keys())[1])

      result = await cdata.getOutColorValues(tx3, [0], EPOBC, getTxFn)
      expect(result).to.be.instanceof(Map).and.to.have.property('size', 2)
      cvs = Array.from(result.values())
      expect(cvs[0]).to.have.length(3)
      expect(cvs[0][0]).to.be.instanceof(cclib.ColorValue)
      expect(cvs[0][0].getColorDefinition()._genesis.txId).to.equal(tx1.id)
      expect(cvs[0][0].getValue()).to.equal(5)
      expect(cvs[0][0].getColorId()).to.equal(result.keys().next().value)
      expect(cvs[0][1]).to.be.null
      expect(cvs[0][2]).to.be.null
      expect(cvs[1]).to.have.length(3)
      expect(cvs[1][0]).to.be.null
      expect(cvs[1][1]).to.be.null
      expect(cvs[1][2]).to.be.null
    })
  })

  it('remove color values', async () => {
    let data = {
      colorCode: EPOBC.getColorCode(),
      txId: getRandomBytes(32).toString('hex'),
      outIndex: 0,
      colorId: 1,
      value: 10
    }

    await cdataStorage.add(data)
    await cdata.removeColorValues(data.txId, EPOBC)
    let result = await cdataStorage.get(data)
    expect(result).to.be.instanceof(Map).and.to.have.property('size', 0)
  })
})
