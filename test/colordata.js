import _ from 'lodash'
import bitcore from 'bitcore'
import { pseudoRandomBytes as getRandomBytes } from 'crypto'
import { expect } from 'chai'

import cclib from '../src'
let EPOBC = cclib.definitions.EPOBC

import helpers from './helpers'

describe('ColorData', () => {
  let tx1
  let tx2
  let tx3

  let cdefstorage
  let cdmanager
  let cdstorage
  let cdata

  beforeEach((done) => {
    tx1 = new bitcore.Transaction()
    tx2 = new bitcore.Transaction()
    tx3 = new bitcore.Transaction()

    cdefstorage = new cclib.storage.definitions.Memory()
    cdmanager = new cclib.definitions.Manager(cdefstorage)

    cdstorage = new cclib.storage.data.Memory()
    cdata = new cclib.ColorData(cdstorage, cdmanager)

    Promise.resolve()
      .then(async () => {
        await* [cdefstorage.ready, cdstorage.ready]
      })
      .then(done, done)
  })

  describe('getTxColorValues', () => {
    it('not a color tx', (done) => {
      Promise.resolve()
        .then(async () => {
          helpers.tx.addInput(tx1, new Buffer(32), 0, 0xffffffff)
          helpers.tx.addOutput(tx1, _.random(1, 1000))

          let getTxFn = helpers.getTxFnStub([])
          let result = await cdata.getTxColorValues(tx1, null, EPOBC, getTxFn)
          expect(result).to.be.an('object')
          expect(result.inputs).to.be.an('array').and.to.have.length(0)
          expect(result.outputs).to.be.an('array').and.to.have.length(0)
        })
        .then(done, done)
    })

    it('genesis tx', (done) => {
      Promise.resolve()
        .then(async () => {
          helpers.tx.addInput(tx1, new Buffer(32), 0, 37 | (2 << 6))
          helpers.tx.addOutput(tx1, 11)

          let getTxFn = helpers.getTxFnStub([])
          let result = await cdata.getTxColorValues(tx1, null, EPOBC, getTxFn)
          expect(result).to.be.an('object')
          expect(result.inputs).to.be.an('array').and.to.have.length(0)
          expect(result.outputs).to.be.an('array').and.to.have.length(1)

          let output = result.outputs[0]
          expect(output).to.be.an('object')
          expect(output.cdef).to.be.instanceof(EPOBC)
          expect(output.cdef._genesis.txid).to.equal(tx1.id)
          expect(output.outputs).to.be.an('array').and.to.have.length(1)

          let ocvalue = output.outputs[0]
          expect(ocvalue).to.be.instanceof(cclib.ColorValue)
          expect(ocvalue.getColorDefinition()).to.deep.equal(output.cdef)
          expect(ocvalue.getValue()).to.equal(7)
        })
        .then(done, done)
    })

    it('transfer tx', (done) => {
      Promise.resolve()
        .then(async () => {
          helpers.tx.addInput(tx1, new Buffer(32), 0, 37 | (2 << 6))
          helpers.tx.addOutput(tx1, 11)

          helpers.tx.addInput(tx2, tx1.id, 0, 51 | (2 << 6))
          helpers.tx.addOutput(tx2, 10)

          let getTxFn = helpers.getTxFnStub([tx1])
          let result = await cdata.getTxColorValues(tx2, [0], EPOBC, getTxFn)
          expect(result).to.be.an('object')

          expect(result.inputs).to.be.an('array').and.to.have.length(1)
          let input = result.inputs[0]
          expect(input.cdef).to.be.instanceof(EPOBC)
          expect(input.cdef._genesis.txid).to.equal(tx1.id)
          expect(input.inputs).to.be.an('array').and.to.have.length(1)
          let icvalue = input.inputs[0]
          expect(icvalue).to.be.instanceof(cclib.ColorValue)
          expect(icvalue.getColorDefinition()).to.deep.equal(input.cdef)
          expect(icvalue.getValue()).to.equal(7)

          expect(result.outputs).to.be.an('array').and.to.have.length(1)
          let output = result.outputs[0]
          expect(output.cdef).to.be.instanceof(EPOBC)
          expect(output.cdef._genesis.txid).to.equal(tx1.id)
          expect(output.outputs).to.be.an('array').and.to.have.length(1)
          let ocvalue = output.outputs[0]
          expect(ocvalue).to.be.instanceof(cclib.ColorValue)
          expect(ocvalue.getColorDefinition()).to.deep.equal(output.cdef)
          expect(ocvalue.getValue()).to.equal(6)
        })
        .then(done, done)
    })
  })

  describe('getOutputColorValue', () => {
    it('tranfer tx from 2 genesis tx', (done) => {
      Promise.resolve()
        .then(async () => {
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
          let result = await cdata.getOutputColorValue(tx3, 0, EPOBC, getTxFn)
          expect(result).to.be.an('array').and.to.have.length(1)
          let cv = result[0]
          expect(cv).to.be.instanceof(cclib.ColorValue)
          expect(cv.getColorDefinition()._genesis.txid).to.equal(tx1.id)
          expect(cv.getValue()).to.equal(5)

          result = await cdata.getOutputColorValue(tx3, 1, EPOBC, getTxFn)
          expect(result).to.be.an('array').and.to.have.length(0)

          result = await cdata.getOutputColorValue(tx3, 2, EPOBC, getTxFn)
          expect(result).to.be.an('array').and.to.have.length(1)
          cv = result[0]
          expect(cv).to.be.instanceof(cclib.ColorValue)
          expect(cv.getColorDefinition()._genesis.txid).to.equal(tx2.id)
          expect(cv.getValue()).to.equal(10)
        })
        .then(done, done)
    })
  })

  it('remove color values', (done) => {
    Promise.resolve()
      .then(async () => {
        let data = {
          colorCode: EPOBC.getColorCode(),
          txid: getRandomBytes(32).toString('hex'),
          oidx: 0,
          colorId: 1,
          value: 10
        }

        await cdstorage.add(data)
        await cdata.removeColorValues(data.txid, EPOBC)
        let result = await cdstorage.get(data)
        expect(Array.from(result.keys())).to.have.length(0)
      })
      .then(done, done)
  })
})
