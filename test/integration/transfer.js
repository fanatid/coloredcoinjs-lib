import bitcore from 'bitcore'
import { expect } from 'chai'

import cclib from '../../src'

describe('coloredcoinjs-lib (transfer)', () => {
  it('uncolored', (done) => {
    Promise.resolve()
      .then(async () => {
        // http://tbtc.blockr.io/tx/info/87dec49cc16846b0b28a985102bec306c8266b0694ffdf0392a036e3f8646b3e

        let pk1 = bitcore.PrivateKey(
          'cQY9eoeCCP9wcxp1H2DydbUAHWtmsrvXTEGfMaayeDEesAJFnNNm', 'testnet')
        let pk2 = bitcore.PrivateKey(
          'cUJwqRHipdAtHxmyM1K3nMM7HNRryCyEFTc1eZuB2mgwGwxtuaYg', 'testnet')

        let cvalue = new cclib.ColorValue(new cclib.definitions.Uncolored(), 100000)
        let ctarget = new cclib.ColorTarget(
          bitcore.Script.buildPublicKeyHashOut(pk2.toPublicKey()).toHex(), cvalue)

        let optx = new cclib.tx.SimpleOperational({
          targets: [
            ctarget
          ],
          coins: {
            0: [{
              txid: '8656c2b003c9f8ef7bd866cb0b3e6e97366b4fac434b91ee442abec27515d17b',
              oidx: 0,
              value: 1000000
            }]
          },
          changeAddresses: {
            0: pk1.toAddress().toString()
          },
          fee: 0
        })

        let comptx = await cclib.definitions.Uncolored.makeComposedTx(optx)
        expect(comptx).to.be.instanceof(cclib.tx.Composed)

        expect(comptx.getInputs()).to.deep.equal([{
          txid: '8656c2b003c9f8ef7bd866cb0b3e6e97366b4fac434b91ee442abec27515d17b',
          oidx: 0
        }])

        expect(comptx.getOutputs()).to.deep.equal([{
          script: '76a914123ef9cb4a62af063cb30e2513cc01e40bed92e588ac',
          value: 100000
        }, {
          script: '76a914bc60037ba68202e8037dbb61fb65eb71619c56a988ac',
          value: 899000
        }])
      })
      .then(done, done)
  })

  it('EPOBC', (done) => {
    Promise.resolve()
      .then(async () => {
        // http://tbtc.blockr.io/tx/info/87b2e65e7fec95c2ba5d84f5e61779d64df8ca17f2e0f2dd86e56d65c882dce6

        let pk1 = bitcore.PrivateKey(
          'cW4QRvHawwgJNxuSBrUsSpPEkLpLDAemaZ68ciibV64HYHwHATVm', 'testnet')
        let pk2 = bitcore.PrivateKey(
          'cVZRCg3E45bjMiqt16uWDiYsEimtzvUJShAnXUurDxgo44rSu6a2', 'testnet')

        let cdef = await cclib.definitions.EPOBC.fromDesc(
          'epobc:7932c31eca2d7f6798f3edd03cbac195dca6443e49b44918233abfcfe9597f9d:0:318050', 1)
        let cvalue = new cclib.ColorValue(cdef, 100000)
        let targetScript = bitcore.Script.buildPublicKeyHashOut(pk2.toPublicKey())
        let ctarget = new cclib.ColorTarget(targetScript.toHex(), cvalue)

        let optx = new cclib.tx.SimpleOperational({
          targets: [
            ctarget
          ],
          coins: {
            0: [{
              txid: '34ab8f0822dbedb3bff09353e909da8b24dece04610cc461b01f90469dcb706d',
              oidx: 0,
              value: 250000
            }],
            1: [{
              txid: '7932c31eca2d7f6798f3edd03cbac195dca6443e49b44918233abfcfe9597f9d',
              oidx: 0,
              value: 500000
            }]
          },
          changeAddresses: {
            0: pk1.toAddress().toString(),
            1: pk1.toAddress().toString()
          },
          fee: 0
        })

        let comptx = await cclib.definitions.EPOBC.makeComposedTx(optx)
        expect(comptx).to.be.instanceof(cclib.tx.Composed)

        expect(comptx.getInputs()).to.deep.equal([{
          txid: '7932c31eca2d7f6798f3edd03cbac195dca6443e49b44918233abfcfe9597f9d',
          oidx: 0,
          sequence: 51
        }, {
          txid: '34ab8f0822dbedb3bff09353e909da8b24dece04610cc461b01f90469dcb706d',
          oidx: 0
        }])

        expect(comptx.getOutputs()).to.deep.equal([{
          script: '76a9149f2e711e71c1ae8cbe1d785da3c2962d7b1a6e3b88ac',
          value: 100000
        }, {
          script: '76a9140bfea40f3ccecb6da7cd67f1484a537c183be1b288ac',
          value: 400000
        }, {
          script: '76a9140bfea40f3ccecb6da7cd67f1484a537c183be1b288ac',
          value: 249000
        }])
      })
      .then(done, done)
  })
})
