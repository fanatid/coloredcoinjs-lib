var chai = chai || require('chai')
var expect = chai.expect

var coloredcoinlib = coloredcoinlib || require('../src/index')
var blockchain = coloredcoinlib.blockchain


describe('BlockchaininfoDataAPI', function() {
  var bs;

  before(function() {
    bs = new blockchain.BlockchaininfoDataAPI()
  })

  it('getBlockCount', function(done) {
    bs.getBlockCount(function(error, response) {
      expect(error).to.be.null
      expect(response).to.be.a.number
      expect(response).to.be.at.least(0)
      done()
    })
  })
})
