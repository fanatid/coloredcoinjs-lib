import bitcore from 'bitcore-lib'
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
    let tx = new bitcore.Transaction(fixtures[txId])
    let outIndex = 0

    let data = await cdata.getOutColorValues(
      tx, [outIndex], EPOBC, helpers.getTxFn)
    expect(data).to.be.instanceof(Map).and.to.have.property('size', 1)
    let cvs = Array.from(data.values())
    expect(cvs[0]).to.have.length(2)
    expect(cvs[0][0]).to.be.instanceof(cclib.ColorValue)
    expect(cvs[0][0].getColorDefinition()._genesis.txId).to.equal('b8a402f28f247946df2b765f7e52cfcaf8c0714f71b13ae4f151a973647c5170')
    expect(cvs[0][0].getValue()).to.equal(100000)
    expect(cvs[0][0].getColorId()).to.equal(Array.from(data.keys())[0])
  })
})
