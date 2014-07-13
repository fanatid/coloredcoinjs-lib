var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var colordata = coloredcoinlib.colordata


describe('colordata', function() {
  describe('StoredColorData', function() {
  })

  describe('ThinColorData', function() {
    it('inherits StoredColorData', function() {
      var colordata1 = new colordata.ThinColorData()
      expect(colordata1).to.be.instanceof(colordata.StoredColorData)
      expect(colordata1).to.be.instanceof(colordata.ThinColorData)
    })
  })
})
