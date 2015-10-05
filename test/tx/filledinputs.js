import bitcore from 'bitcore'
import { expect } from 'chai'

import cclib from '../../src'

import { getTxFn } from '../helpers'
import transactions from '../fixtures/transactions.json'

describe('tx.FilledInputs', () => {
  let fitx

  describe('isCoinbase', () => {
    let txId = '548be1cc68780cbe0ce7e4b46c06dbe38ecd509a3f448e5ca68cc294679c27b1'
    let rawTx = transactions[txId]

    beforeEach(() => {
      fitx = new cclib.tx.FilledInputs(rawTx, getTxFn)
      return fitx.ready
    })

    it('getTx', () => {
      expect(fitx.getTx().id).to.equal(txId)
    })

    it('getInputTx', async () => {
      let inputTx = await fitx.getInputTx(0)
      expect(inputTx).to.be.null
    })

    it('getInputValue', async () => {
      let inputValue = await fitx.getInputValue(0)
      expect(inputValue).to.equal(0)
    })
  })

  describe('!isCoinbase', () => {
    let txId = '27eba159ab0c50c3d2d1abad6ce83f501b34121fa96d7aa91fad2c3cfec68366'
    let tx = bitcore.Transaction(transactions[txId])

    beforeEach(() => {
      fitx = new cclib.tx.FilledInputs(tx, getTxFn)
      return fitx.ready
    })

    it('getTx', () => {
      expect(fitx.getTx().id).to.equal(txId)
    })

    it('getInputTx', async () => {
      let inputTx = await fitx.getInputTx(0)
      expect(inputTx.id).to.equal(tx.inputs[0].prevTxId.toString('hex'))
    })

    it('getInputValue', async () => {
      let inputValue = await fitx.getInputValue(0)
      expect(inputValue).to.equal(30838652979)
    })
  })
})
