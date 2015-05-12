/* global describe, beforeEach, afterEach, it */
var expect = require('chai').expect

var cclib = require('../../lib')
var helpers = require('../helpers')

describe('coloredcoinjs-lib (balance)', function () {
  var colorDataStorage
  var colorData

  beforeEach(function () {
    colorDataStorage = new cclib.ColorDataStorage()
    colorData = new cclib.ColorData(colorDataStorage)
  })

  afterEach(function () {
    colorDataStorage.clear()
  })

  it('EPOBC', function (done) {
    var epobc = cclib.EPOBCColorDefinition.fromDesc(
      1, 'epobc:b8a402f28f247946df2b765f7e52cfcaf8c0714f71b13ae4f151a973647c5170:0:314325')

    var coin = {
      txId: '694dffbf830e50139c34b80abd20c95f37b1a7e6401be5ef579d6f1f973c6c4c',
      outIndex: 0
    }
    colorData.getCoinColorValue(coin, epobc, helpers.getTestnetTx, function (error, colorValue) {
      expect(error).to.be.null
      expect(colorValue).to.be.instanceof(cclib.ColorValue)
      expect(colorValue.getValue()).to.be.equal(100000)
      done()
    })
  })
})
