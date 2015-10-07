import bitcore from 'bitcore'
import { expect } from 'chai'

import cclib from '../../src'
let EPOBC = cclib.definitions.EPOBC

import helpers from '../helpers'
import fixtures from '../fixtures/transactions.json'

describe('coloredcoinjs-lib (balance)', () => {
  let cdefStorage
  let cdataStorage
  let cdefManager
  let cdata

  beforeEach(() => {
    cdefStorage = new cclib.storage.definitions.Memory()
    cdataStorage = new cclib.storage.data.Memory()

    cdefManager = new cclib.definitions.Manager(cdefStorage, cdataStorage)
    cdata = new cclib.ColorData(cdataStorage, cdefManager)

    return Promise.all([cdefManager.ready, cdata.ready])
  })

  it('EPOBC', async () => {
    let txId = '694dffbf830e50139c34b80abd20c95f37b1a7e6401be5ef579d6f1f973c6c4c'
    let tx = bitcore.Transaction(fixtures[txId])
    let outIndex = 0

    let data = await cdata.getOutputColorValue(
      tx, outIndex, EPOBC, helpers.getTxFn)
    expect(data).to.be.an('array').and.to.have.length(1)
    let cv = data[0]
    expect(cv).to.be.instanceof(cclib.ColorValue)
    expect(cv.getColorDefinition()).to.be.instanceof(EPOBC)
    expect(cv.getColorDefinition()._genesis.txId).to.equal(
      'b8a402f28f247946df2b765f7e52cfcaf8c0714f71b13ae4f151a973647c5170')
    expect(cv.getValue()).to.equal(100000)
  })
})
