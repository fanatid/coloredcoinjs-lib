import { expect } from 'chai'
import _ from 'lodash'
import bitcore from 'bitcore'

import cclib from '../../src'
let EPOBC = cclib.definitions.EPOBC

import helpers from '../helpers'
import { epobc as fixtures } from '../fixtures/definitions.json'

describe('definitions.EPOBC._Tag', () => {
  let Tag = EPOBC._Tag

  it('_number2bitArray', () => {
    let bits = Tag._number2bitArray(54648432)
    expect(bits).to.deep.equal(
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0])
  })

  it('_number2bitArray (specific bits)', () => {
    let bits = Tag._number2bitArray(51, 6)
    expect(bits).to.deep.equal([1, 1, 0, 0, 1, 1])
  })

  it('_bitArray2number', () => {
    let bits = [1, 1, 0, 0, 1, 1]
    expect(Tag._bitArray2number(bits)).to.equal(51)
  })

  it('closestPaddingCode for zero padding', () => {
    let result = Tag.closestPaddingCode(0)
    expect(result).to.equal(0)
  })

  it('closestPaddingCode more than max padding', () => {
    let fn = () => { Tag.closestPaddingCode(Math.pow(2, 64)) }
    expect(fn).to.throw(Error)
  })

  it('closestPaddingCode', () => {
    let result = Tag.closestPaddingCode(7)
    expect(result).to.equal(3)
  })

  it('fromTx for coinbase tx', () => {
    let tx = {
      inputs: [{
        prevTxId: new Buffer(cclib.util.const.ZERO_HASH, 'hex'),
        outputIndex: 4294967295
      }]
    }
    let tag = Tag.fromTx(tx)
    expect(tag).to.be.null
  })

  it('fromTx for not xfer and not genesis tx', () => {
    let tx = {
      inputs: [{
        prevTxId: new Buffer(32),
        outputIndex: 0,
        sequenceNumber: 4294967295
      }]
    }
    let tag = Tag.fromTx(tx)
    expect(tag).to.be.null
  })

  it('fromTx', () => {
    let tx = {
      inputs: [{
        prevTxId: new Buffer(32),
        outputIndex: 0,
        sequenceNumber: 37 | (1 << 6)
      }]
    }
    let tag = Tag.fromTx(tx)
    expect(tag).to.be.instanceof(Tag)
    expect(tag.isGenesis()).to.equal(true)
    expect(tag.getPadding()).to.equal(2)
  })

  it('toSequence for genesis tag', () => {
    let tag = new Tag(10, true)
    expect(tag.toSequence()).to.equal(677)
  })

  it('toSequence for xfer tag', () => {
    let tag = new Tag(10, false)
    expect(tag.toSequence()).to.equal(691)
  })

  it('getPadding #1', () => {
    let tag = new Tag(0, true)
    expect(tag.getPadding()).to.equal(0)
  })

  it('getPadding #2', () => {
    let tag = new Tag(2, true)
    expect(tag.getPadding()).to.equal(4)
  })
})

describe('definitions.EPOBC', () => {
  let genesis = {
    txId: new Buffer(32).toString('hex'),
    outIndex: _.random(0, 10),
    height: _.random(100000, 400000)
  }
  let epobc
  let tx1
  let tx2

  beforeEach(() => {
    tx1 = new bitcore.Transaction()
    tx2 = new bitcore.Transaction()
    epobc = new EPOBC(1, genesis)
  })

  it('inherits IColorDefinition', () => {
    expect(epobc).to.be.instanceof(EPOBC)
    expect(epobc).to.be.instanceof(cclib.definitions.Interface)
  })

  describe('fromDesc', () => {
    it('throw error', async () => {
      try {
        await EPOBC.fromDesc('obc:11:2:3')
        throw new Error()
      } catch (err) {
        expect(err).to.be.instanceof(cclib.errors.ColorDefinition.IncorrectDesc)
      }
    })

    it('return EPOBCColorDefinition', async () => {
      let epobc2 = await EPOBC.fromDesc(epobc.getDesc(), epobc.getColorId())
      expect(epobc2).to.deep.equal(epobc)
    })
  })

  describe('fromTx', () => {
    beforeEach(() => {
      helpers.tx.addInput(tx1, new Buffer(32), 0, 37 | (3 << 6))
      helpers.tx.addOutput(tx1, 9)
    })

    it('return null', async () => {
      tx1.outputs[0].satoshis = 8
      let epobc = await EPOBC.fromTx(tx1, 1)
      expect(epobc).to.be.null
    })

    it('from color id', async () => {
      let epobc = await EPOBC.fromTx(tx1, 1)
      expect(epobc).to.be.instanceof(EPOBC)
      expect(epobc.getColorId()).to.equal(1)
    })

    it('resolve with color definition manager', async () => {
      let cdstorage = new cclib.storage.definitions.Memory()
      let cdmanager = new cclib.definitions.Manager(cdstorage)

      try {
        let deferred
        let promise = new Promise((resolve, reject) => {
          deferred = {resolve: resolve, reject: reject}
        })

        cdmanager.on('new', (cdef) => {
          Promise.resolve()
            .then(() => {
              expect(cdef).to.be.instanceof(EPOBC)
              expect(cdef.getDesc()).to.match(new RegExp(tx1.id))
            })
            .then(deferred.resolve, deferred.reject)
        })

        await cdstorage.ready
        let epobc = await EPOBC.fromTx(tx1, cdmanager)
        expect(epobc).to.be.instanceof(EPOBC)
        expect(epobc.getDesc()).to.match(new RegExp(tx1.id))
        await promise
      } finally {
        cdmanager.removeAllListeners()
      }
    })
  })

  describe('getDesc', () => {
    it('#1', () => {
      let items = [genesis.txId, genesis.outIndex, genesis.height]
      expect(epobc.getDesc()).to.equal('epobc:' + items.join(':'))
    })
  })

  describe('runKernel', () => {
    fixtures.runKernel.forEach(function (f) {
      it(f.description, async () => {
        if (f.description.indexOf('genesis') !== -1) {
          epobc._genesis.txId = f.txId
        }

        let env = helpers.createRunKernelEnv(
          f.txId, f.inputs, f.outputs, f.sequence)

        let inColorValues = f.inColorValues.map(function (cv) {
          if (cv !== null) {
            cv = new cclib.ColorValue(epobc, cv)
          }

          return cv
        })

        let getTxFn = helpers.getTxFnStub(env.deps)
        let result = await epobc.runKernel(env.top, inColorValues, getTxFn)
        expect(result).to.be.instanceof(Array)

        result = result.map(function (value) {
          if (value !== null) {
            value = value.getValue()
          }

          return value
        })

        expect(result).to.deep.equal(f.expect)
      })
    })
  })

  describe('getAffectingInputs', () => {
    it('tag is null', async () => {
      let tx = {
        inputs: [{
          prevTxId: new Buffer(cclib.util.const.ZERO_HASH, 'hex'),
          sequenceNumber: 4294967295
        }]
      }
      let getTxFn = helpers.getTxFnStub([])
      let inputs = await EPOBC.getAffectingInputs(tx, [], getTxFn)
      expect(inputs).to.deep.equal([])
    })

    it('genesis tag', async () => {
      let tx = {
        inputs: [{
          prevTxId: new Buffer(32),
          sequenceNumber: 37
        }]
      }
      let getTxFn = helpers.getTxFnStub([])
      let inputs = await EPOBC.getAffectingInputs(tx, [], getTxFn)
      expect(inputs).to.deep.equal([])
    })

    it('return affecting index', async () => {
      helpers.tx.addInput(tx1, new Buffer(32), 0, 37 | (2 << 6))
      helpers.tx.addOutput(tx1, 11)

      helpers.tx.addInput(tx2, tx1.id, 0, 51 | (2 << 6))
      helpers.tx.addOutput(tx2, 10)

      let getTxFn = helpers.getTxFnStub([tx1])
      let indices = await EPOBC.getAffectingInputs(tx2, [0], getTxFn)
      expect(indices).to.deep.equal([0])
    })
  })
})
