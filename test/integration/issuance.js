import bitcore from 'bitcore'
import { expect } from 'chai'

import cclib from '../../src'

describe('coloredcoinjs-lib (issuance)', () => {
  it('EPOBC', (done) => {
    Promise.resolve()
      .then(async () => {
        // http://tbtc.blockr.io/tx/info/7932c31eca2d7f6798f3edd03cbac195dca6443e49b44918233abfcfe9597f9d

        let pk1 = bitcore.PrivateKey(
          'cMgKymqtZtF2dCPXwR9h9yYnJm3Mno9xfuSjNXy42ByyW96qcqyT', 'testnet')
        let pk2 = bitcore.PrivateKey(
          'cW4QRvHawwgJNxuSBrUsSpPEkLpLDAemaZ68ciibV64HYHwHATVm', 'testnet')

        let genesisCdef = cclib.definitions.Manager.getGenesis()
        let cvalue = new cclib.ColorValue(genesisCdef, 500000)
        let targetScript = bitcore.Script.buildPublicKeyHashOut(pk2.toPublicKey())
        let ctarget = new cclib.ColorTarget(targetScript.toHex(), cvalue)

        let optx = new cclib.tx.SimpleOperational({
          targets: [
            ctarget
          ],
          coins: {
            0: [{
              txid: '036c3688512eb99427ad9dfe979958cd5929d0cbd3babb6c4275316dbb3b4dce',
              oidx: 1,
              value: 1000000
            }]
          },
          changeAddresses: {
            0: pk1.toAddress().toString()
          },
          fee: 0
        })

        let comptx = await cclib.definitions.EPOBC.composeGenesisTx(optx)
        expect(comptx).to.be.instanceof(cclib.tx.Composed)

        expect(comptx.getInputs()).to.deep.equal([{
          txid: '036c3688512eb99427ad9dfe979958cd5929d0cbd3babb6c4275316dbb3b4dce',
          oidx: 1,
          sequence: 37
        }])

        expect(comptx.getOutputs()).to.deep.equal([{
          script: '76a9140bfea40f3ccecb6da7cd67f1484a537c183be1b288ac',
          value: 500000
        }, {
          script: '76a9149c271ef60474f2cce2db555d92deab35d9158ffd88ac',
          value: 499000
        }])
      })
      .then(done, done)
  })
})
