var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey
var networks = bitcoin.networks

var coloredcoinlib = require('../src/index')
var Address = coloredcoinlib.Address


describe('Address', function() {
  var address
  var pubKey0 =  ECPubKey.fromHex('021c10af30f8380f1ff05a02e10a69bd323a7305c43dc461f79c2b27c13532a12c')

  it('getAddress for bitcoin', function() {
    address = new Address({ pubKey: pubKey0, network: networks.bitcoin })
    expect(address.getAddress()).to.equal('18KMigSHDPVFzsgWe1mcaPPA5wSY3Ur5wS')
  })

  it('getAddress for testnet', function() {
    address = new Address({ pubKey: pubKey0, network: networks.testnet })
    expect(address.getAddress()).to.equal('mnqK1jXG2QvWmzA8MajzQJbUww3ExLrWTA')
  })
})
