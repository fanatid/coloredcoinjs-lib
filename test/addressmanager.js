var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')

var coloredcoinlib = require('../src/index')
var AddressManager = coloredcoinlib.AddressManager


describe('AddressManager', function() {
  var am

  var seedHex = '00000000000000000000000000000000'
  var masterKeyBase58 = 'xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ6zZNcJaiJogsRaLaYFFjs48qt4Fg7y1GnmrchQt1zFNu6QVnta'
  var masterKeyHex = '\
0488ade400000000000000000018aab7e9ef169f3029d93651d0c85303cbcc2ac559ccd04c324a2e678ef26dc900330fd355e141910d33bbe84c369b87a209dd18b81095912be766b2b5a9d72bc4'

  describe('constructor', function() {
    it('masterKey is buffer', function() {
      am = new AddressManager(new Buffer(masterKeyHex, 'hex'))
      // Todo
    })

    it('masterKey is hex string', function() {
      am = new AddressManager(masterKeyHex)
      // Todo
    })

    it('masterKey is base58', function() {
      am = new AddressManager(masterKeyBase58)
      // Todo
    })
  })

  describe('fromSeed', function() {
    it('seed is Buffer', function() {
      var masterKey = AddressManager.getMasterKeyFromSeed(new Buffer(seedHex, 'hex'))
      expect(masterKey).to.equal(masterKeyHex)
    })

    it('seed is hex strng', function() {
      var masterKey = AddressManager.getMasterKeyFromSeed(seedHex)
      expect(masterKey).to.equal(masterKeyHex)
    })
  })

  describe('getMasterKey', function() {
    beforeEach(function() {
      am = new AddressManager(masterKeyBase58)
    })

    it('get as buffer', function() {
      expect(am.getMasterKey('buffer').toString('hex')).to.equal(masterKeyHex)
    })

    it('get as hex', function() {
      expect(am.getMasterKey()).to.equal(masterKeyHex)
    })

    it('get as base58', function() {
      expect(am.getMasterKey('base58')).to.equal(masterKeyBase58)
    })
  })

  describe('getAddress', function() {
    var addr

    beforeEach(function() {
      am = new AddressManager(masterKeyBase58)
    })

    it('get 0s address', function() {
      addr = am.getAddress(0)
      expect(addr.getAddress()).to.equal('18KMigSHDPVFzsgWe1mcaPPA5wSY3Ur5wS')
    })

    it('get 1000s address', function() {
      addr = am.getAddress(1000)
      expect(addr.getAddress()).to.equal('144Y8mBWhjp83P16fUZ37fcy3xmK9K1aLc')
    })
  })
})
