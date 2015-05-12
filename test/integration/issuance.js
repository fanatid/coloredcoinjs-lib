/* global describe, it */
var expect = require('chai').expect

var cclib = require('../../lib')
var bitcoin = cclib.bitcoin

describe('coloredcoinjs-lib (issuance)', function () {
  it('EPOBC', function (done) {
    // http://tbtc.blockr.io/tx/info/7932c31eca2d7f6798f3edd03cbac195dca6443e49b44918233abfcfe9597f9d

    var privkey1 = bitcoin.ECKey.fromWIF('KwKLWrr38pYmTkvGZ1LZnf3igXjx8M4GbsJGG7WYX5KyFQ4qnqMU')
    var privkey2 = bitcoin.ECKey.fromWIF('L5hQy1HjWsz3DXSAoSfk5VtB87WvYiZ5WWwfWJG5yyQHHYqWzHrb')

    var colorValue = new cclib.ColorValue(cclib.ColorDefinitionManager.getGenesis(), 500000)
    var colorTarget = new cclib.ColorTarget(
      privkey2.pub.getAddress(bitcoin.networks.testnet).toOutputScript().toHex(), colorValue)

    var opTx = new cclib.SimpleOperationalTx({
      targets: [
        colorTarget
      ],
      coins: [
        {
          colorId: 0,
          txId: '036c3688512eb99427ad9dfe979958cd5929d0cbd3babb6c4275316dbb3b4dce',
          outIndex: 1,
          value: 1000000
        }
      ],
      changeAddresses: {
        0: privkey1.pub.getAddress(bitcoin.networks.testnet).toBase58Check()
      },
      fee: 0
    })

    cclib.EPOBCColorDefinition.composeGenesisTx(opTx, function (error, composedTx) {
      if (error) throw error
      expect(error).to.be.null
      expect(composedTx).to.be.instanceof(cclib.ComposedTx)

      var txb = new bitcoin.TransactionBuilder()
      composedTx.getTxIns().forEach(function (txIn) {
        txb.addInput(txIn.txId, txIn.outIndex, txIn.sequence)
      })
      composedTx.getTxOuts().forEach(function (txOut) {
        txb.addOutput(bitcoin.Script.fromHex(txOut.script), txOut.value)
      })

      txb.sign(0, privkey1)

      var tx = txb.build()
      expect(tx.toHex()).to.equal([
        '0100000001ce4d3bbb6d3175426cbbbad3cbd02959cd589997fe9dad2794b92e5188366c03010000',
        '006b483045022100b7911bf5831b096c837af158bd5de0671516b6439bf8a05419605345aa40c702',
        '022053b335531ca89936aaeb8c2aa27660f225b75f39f383e9a62235941504be09f8012103671691',
        'cbe2ac26680ed23a489a67bd3107a5dd1bc830932166626e1bc2cdec2a250000000220a107000000',
        '00001976a9140bfea40f3ccecb6da7cd67f1484a537c183be1b288ac389d0700000000001976a914',
        '9c271ef60474f2cce2db555d92deab35d9158ffd88ac00000000'
      ].join(''))

      done()
    })
  })
})
