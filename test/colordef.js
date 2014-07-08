var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')

var coloredcoinlib = require('../src/index')
var colordef = coloredcoinlib.colordef


describe('ColorDefinition', function() {
  it('crete ColorDefinition', function() {
    var colorDef = new colordef.ColorDefinition(5)
    expect(colorDef.colorID).to.equal(5)
  })

  it('genesisOutputMarker', function() {
    expect(colordef.genesisOutputMarker.colorID).to.equal(-1)
  })

  it('uncoloredMarker', function() {
    expect(colordef.uncoloredMarker.colorID).to.equal(0)
  })
})

describe('EPOBCColorDefinition', function() {
  var bs
  var epobc
  var tx

  beforeEach(function() {
    bs = new coloredcoinlib.blockchain.BlockchaininfoDataAPI()
    epobc = new colordef.EPOBCColorDefinition(1, {
      'txhash': 'genesis',
      'outindex': 0,
      'height': 0
    })
    tx = new bitcoin.Transaction()
  })

  describe('getAffectingInputs', function() {
    it('getTag return null', function(done) {
      tx.addInput(
        '0000000000000000000000000000000000000000000000000000000000000000',
        4294967295,
        4294967295
      )
      epobc.getAffectingInputs(tx, [], undefined, function(error, inputs) {
        expect(error).to.be.null
        expect(inputs).to.deep.equal([])
        done()
      })
    })

    it('getTag return genesis tag', function(done) {
      tx.addInput(
        '09badec3642e0478cb8f8accf5bb35f6367ff5274f323707495a647ae9e84fb3',
        0,
        37
      )
      epobc.getAffectingInputs(tx, [], undefined, function(error, inputs) {
        expect(error).to.be.null
        expect(inputs).to.deep.equal([])
        done()
      })
    })



  })
})

