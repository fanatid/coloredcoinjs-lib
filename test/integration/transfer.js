/* global describe, it */
var expect = require('chai').expect

var cclib = require('../../lib')
var bitcoin = cclib.bitcoin

describe('coloredcoinjs-lib (transfer)', function () {
  it('uncolored', function (done) {
    // http://tbtc.blockr.io/tx/info/87dec49cc16846b0b28a985102bec306c8266b0694ffdf0392a036e3f8646b3e

    var privkey1 = bitcoin.ECKey.fromWIF('KzBABteLmKTgTXLjtcQrGGy6fHbNDQpqPC8CFA8U96aecRFZMCob')
    var privkey2 = bitcoin.ECKey.fromWIF('L3wxNWHsPZUd8XJhxbVvR2r3f98TJksYBRTYY9SfXf2w2Crn83n1')

    var colorValue = new cclib.ColorValue(cclib.ColorDefinitionManager.getUncolored(), 100000)
    var colorTarget = new cclib.ColorTarget(
      privkey2.pub.getAddress(bitcoin.networks.testnet).toOutputScript().toHex(), colorValue)

    var opTx = new cclib.SimpleOperationalTx({
      targets: [
        colorTarget
      ],
      coins: [
        {
          colorId: 0,
          txId: '8656c2b003c9f8ef7bd866cb0b3e6e97366b4fac434b91ee442abec27515d17b',
          outIndex: 0,
          value: 1000000
        }
      ],
      changeAddresses: {
        0: privkey1.pub.getAddress(bitcoin.networks.testnet).toBase58Check()
      },
      fee: 0
    })

    cclib.UncoloredColorDefinition.makeComposedTx(opTx)
      .then(function (composedTx) {
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
          '01000000017bd11575c2be2a44ee914b43ac4f6b36976e3e0bcb66d87beff8c903b0c25686000000',
          '006a47304402205e0284000c7c6f08b0453355e556027240cc93a3a8be3d146073b9c0d6f9d19e02',
          '2022b297a6d4059eecaa253aa99eb563bc5eef54698771436e20e60b1fc1da7f9d012103d1d49595',
          '9464c1567e1edbbdcab7f7533d8b4a2a4ff231b1a8346effe99181c2ffffffff02a0860100000000',
          '001976a914123ef9cb4a62af063cb30e2513cc01e40bed92e588acb8b70d00000000001976a914bc',
          '60037ba68202e8037dbb61fb65eb71619c56a988ac00000000'
        ].join(''))
      })
      .done(done, done)
  })

  it('EPOBC', function (done) {
    // http://tbtc.blockr.io/tx/info/87b2e65e7fec95c2ba5d84f5e61779d64df8ca17f2e0f2dd86e56d65c882dce6

    var privkey1 = bitcoin.ECKey.fromWIF('L5hQy1HjWsz3DXSAoSfk5VtB87WvYiZ5WWwfWJG5yyQHHYqWzHrb')
    var privkey2 = bitcoin.ECKey.fromWIF('L5CRjm3Nd1uUCHNcch6NrQ3ocVUVLUNcNf2KR4TLir2noKo9J8J3')

    var colordef = cclib.EPOBCColorDefinition.fromDesc(
      1, 'epobc:7932c31eca2d7f6798f3edd03cbac195dca6443e49b44918233abfcfe9597f9d:0:318050')
    var colorValue = new cclib.ColorValue(colordef, 100000)
    var colorTarget = new cclib.ColorTarget(
      privkey2.pub.getAddress(bitcoin.networks.testnet).toOutputScript().toHex(), colorValue)

    var opTx = new cclib.SimpleOperationalTx({
      targets: [
        colorTarget
      ],
      coins: [
        {
          colorId: 0,
          txId: '34ab8f0822dbedb3bff09353e909da8b24dece04610cc461b01f90469dcb706d',
          outIndex: 0,
          value: 250000
        },
        {
          colorId: 1,
          txId: '7932c31eca2d7f6798f3edd03cbac195dca6443e49b44918233abfcfe9597f9d',
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

    cclib.EPOBCColorDefinition.makeComposedTx(opTx)
      .then(function (composedTx) {
        expect(composedTx).to.be.instanceof(cclib.ComposedTx)

        var txb = new bitcoin.TransactionBuilder()
        composedTx.getTxIns().forEach(function (txIn) {
          txb.addInput(txIn.txId, txIn.outIndex, txIn.sequence)
        })
        composedTx.getTxOuts().forEach(function (txOut) {
          txb.addOutput(bitcoin.Script.fromHex(txOut.script), txOut.value)
        })

        txb.sign(0, privkey1)
        txb.sign(1, privkey1)

        var tx = txb.build()
        expect(tx.toHex()).to.equal([
          '01000000029d7f59e9cfbf3a231849b4493e44a6dc95c1ba3cd0edf398677f2dca1ec33279000000',
          '006a47304402200c303391fe688bb337ffdaf00b8337ee3460cc5d7b3af9a9510da68ae7d7128502',
          '201d118e85166ad7b80b92b222e85517cb394f43c1d3b4552789c42855f0e514e8012103eac447bc',
          '7f2898f6094a1fd0dd596cc5c449b5e773c1f41cab8cbb0a1213802e330000006d70cb9d46901fb0',
          '61c40c6104cede248bda09e95393f0bfb3eddb22088fab34000000006a47304402203637eb16d107',
          'eab037b26e62e35342f02c80b882154faba43fe95fd0093fbbf502205fbb806d851512c85eb6786b',
          '63f54bfcf03a77367bbda114fd0622a12d2d7c8d012103eac447bc7f2898f6094a1fd0dd596cc5c4',
          '49b5e773c1f41cab8cbb0a1213802effffffff03a0860100000000001976a9149f2e711e71c1ae8c',
          'be1d785da3c2962d7b1a6e3b88ac801a0600000000001976a9140bfea40f3ccecb6da7cd67f1484a',
          '537c183be1b288aca8cc0300000000001976a9140bfea40f3ccecb6da7cd67f1484a537c183be1b2',
          '88ac00000000'
        ].join(''))
      })
      .done(done, done)
  })
})
