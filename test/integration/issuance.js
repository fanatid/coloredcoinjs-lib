var expect = require('chai').expect

var cclib = require('../../src')
var bitcoin = cclib.bitcoin
var SimpleOperationalTx = require('./SimpleOperationalTx')


describe('coloredcoinjs-lib (issuance)', function () {
  it('EPOBC', function (done) {
    // http://tbtc.blockr.io/tx/info/b8a402f28f247946df2b765f7e52cfcaf8c0714f71b13ae4f151a973647c5170

    var privkey1 = bitcoin.ECKey.fromWIF('KybkeESGGzvx1qLrjk7arngeD8iRXeoxYLrbAw4hFdW9EETB1oeY')
    var privkey2 = bitcoin.ECKey.fromWIF('L2xR4uHNeQ9HQaRWxGvKkbUScDPewXrNsbdu3U7JfCanyxWGBNp8')

    var colorValue = new cclib.ColorValue(cclib.ColorDefinitionManager.getGenesis(), 500000)
    var colorTarget = new cclib.ColorTarget(
      privkey2.pub.getAddress(bitcoin.networks.testnet).toOutputScript().toHex(), colorValue)

    var opTx = new SimpleOperationalTx({
      targets: [
        colorTarget
      ],
      coins: [
        {
          colorId: 0,
          txId: '5706b46de635475fb98193731d2f2faa6eda3722683dedd8d2fdd0f218a63e68',
          outIndex: 1,
          value: 5000000
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
        '0100000001683ea618f2d0fdd2d8ed3d682237da6eaa2f2f1d739381b95f4735e66db40657010000',
        '006b483045022100e88ccc1fa4e2583681295f3fcd1393d7ec4646b1db4644ca3c66fe56023a009c',
        '02201328100212f52b24f6409055579b49ad00fc0c8736be57675ff1f8d83ba73f74012103c5d2e8',
        '4f7b1b2676496d5d1839a25a93a89bc951ea1830a1dd0f6e7c612154b5250000000220a107000000',
        '00001976a9148733f3912b68afe15c3a290d12906f9ce072087288ac20aa4400000000001976a914',
        '898b602d4734940fa9a87e998b8715f19f4dfee588ac00000000'
      ].join(''))

      done()
    })
  })
})
