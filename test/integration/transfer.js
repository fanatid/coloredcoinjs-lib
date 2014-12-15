var expect = require('chai').expect

var cclib = require('../../src')
var bitcoin = cclib.bitcoin
var SimpleOperationalTx = require('./SimpleOperationalTx')


describe('coloredcoinjs-lib (transfer)', function () {
  it('EPOBC', function (done) {
    // http://tbtc.blockr.io/tx/info/694dffbf830e50139c34b80abd20c95f37b1a7e6401be5ef579d6f1f973c6c4c

    var privkey1 = bitcoin.ECKey.fromWIF('L2xR4uHNeQ9HQaRWxGvKkbUScDPewXrNsbdu3U7JfCanyxWGBNp8')
    var privkey2 = bitcoin.ECKey.fromWIF('Kyyx8eqVDHGx8sJUvTojYroYJS7jvCRZPVCEvxpj6KuTE8kc2CDg')

    var colordef = new cclib.EPOBCColorDefinition.fromDesc(
      1, 'epobc:b8a402f28f247946df2b765f7e52cfcaf8c0714f71b13ae4f151a973647c5170:0:314325')
    var colorValue = new cclib.ColorValue(colordef, 100000)
    var colorTarget = new cclib.ColorTarget(
      privkey2.pub.getAddress(bitcoin.networks.testnet).toOutputScript().toHex(), colorValue)

    var opTx = new SimpleOperationalTx({
      targets: [
        colorTarget
      ],
      coins: [
        {
          colorId: 0,
          txId: '6f66ba0487da6c4293df54dd58136eec6e1c070eda0c7027154843ca99e6281a',
          outIndex: 1,
          value: 1000000
        },
        {
          colorId: 1,
          txId: 'b8a402f28f247946df2b765f7e52cfcaf8c0714f71b13ae4f151a973647c5170',
          outIndex: 0,
          value: 500000
        }
      ],
      changeAddresses: {
        0: privkey1.pub.getAddress(bitcoin.networks.testnet).toBase58Check(),
        1: privkey1.pub.getAddress(bitcoin.networks.testnet).toBase58Check()
      },
      fee: 0
    })

    cclib.EPOBCColorDefinition.makeComposedTx(opTx, function (error, composedTx) {
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
        '010000000170517c6473a951f1e43ab1714f71c0f8cacf527e5f762bdf4679248ff202a4b8000000',
        '006b4830450221009c4c652bfa4a8c02195d349944e2e051fec62afa7fdf0bea3ed62f2b4c518143',
        '022012c8c6b1dd990abafb41ba5436125abe525817a0abaa5db0ffeb1bf46ef45f5c0121038c34c7',
        'bfbed6c7cc3ac456b6660951a80e278a5adbb8efd78b2cdb7fef61d24c3300000002a08601000000',
        '00001976a9146a24492d44a5939703769682da45e65103cc9aa888ac801a0600000000001976a914',
        '8733f3912b68afe15c3a290d12906f9ce072087288ac00000000'
      ].join(''))

      done()
    })
  })
})
