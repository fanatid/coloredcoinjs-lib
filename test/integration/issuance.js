/* global describe, it */
var expect = require('chai').expect
var bitcore = require('bitcore')

var cclib = require('../../')

describe('coloredcoinjs-lib (issuance)', function () {
  it('EPOBC', function (done) {
    // http://tbtc.blockr.io/tx/info/7932c31eca2d7f6798f3edd03cbac195dca6443e49b44918233abfcfe9597f9d

    var pk1 = bitcore.PrivateKey(
      'cMgKymqtZtF2dCPXwR9h9yYnJm3Mno9xfuSjNXy42ByyW96qcqyT', 'testnet')
    var pk2 = bitcore.PrivateKey(
      'cW4QRvHawwgJNxuSBrUsSpPEkLpLDAemaZ68ciibV64HYHwHATVm', 'testnet')

    var cvalue = new cclib.ColorValue(new cclib.definitions.Genesis(), 500000)
    var ctarget = new cclib.ColorTarget(
      bitcore.Script.buildPublicKeyHashOut(pk2.toPublicKey()).toHex(), cvalue)

    var optx = new cclib.tx.SimpleOperationalTx({
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

    cclib.definitions.EPOBC.composeGenesisTx(optx)
      .then(function (comptx) {
        expect(comptx).to.be.instanceof(cclib.tx.ComposedTx)

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
      .done(done, done)
  })
})
