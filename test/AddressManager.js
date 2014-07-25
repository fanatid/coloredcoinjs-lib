var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')
var networks = bitcoin.networks

var coloredcoinlib = require('../src/index')
var AddressManager = coloredcoinlib.AddressManager
var AddressManagerStore = coloredcoinlib.store.AddressManagerStore


describe('AddressManager', function() {
  var am, amStore

  var seedHex = '00000000000000000000000000000000'
  var masterKeyBase58 = 'xprv9s21ZrQH143K2JbpEjGU94NcdKSASB7LuXvJCTsxuENcGN1nVG7QjMnBZ6zZNcJaiJogsRaLaYFFjs48qt4Fg7y1GnmrchQt1zFNu6QVnta'
  var address0 = '18KMigSHDPVFzsgWe1mcaPPA5wSY3Ur5wS'

  beforeEach(function() {
    amStore = new AddressManagerStore()
    am = new AddressManager(amStore)
  })

  afterEach(function() {
    amStore.clear()
  })

  describe('setMasterKeyFromSeed', function() {
    it('from Buffer', function() {
      am.setMasterKeyFromSeed(new Buffer(seedHex, 'hex'), networks.bitcoin)
      var masterKey = am.getMasterKey()
      expect(masterKey).to.equal(masterKeyBase58)
    })

    it('from Hex string', function() {
      am.setMasterKeyFromSeed(seedHex, networks.bitcoin)
      var masterKey = am.getMasterKey()
      expect(masterKey).to.equal(masterKeyBase58)
    })
  })

  describe('getNewAddress', function() {
    beforeEach(function() {
      am.setMasterKey(masterKeyBase58)
    })

    it('masterKey is undefined', function() {
      am.getMasterKey = function() { return undefined }
      var fn = function() { am.getNewAddress() }
      expect(fn).to.throw(Error)
    })

    it('addPubKey throw error', function() {
      am.getNewAddress()
      var pubKeyHex = am.getNewAddress().pubKey.toHex()
      am.amStore.store.set(am.amStore.pubKeysDBKey, []) // not good
      am.amStore.addPubKey({ account: 0, chain: 0, index: 0, pubKey: pubKeyHex })
      var fn = function() { am.getNewAddress() }
      expect(fn).to.throw(Error)
    })

    it('getNewAddress once', function() {
      var newAddress = am.getNewAddress()
      expect(newAddress.getAddress()).to.equal(address0)
    })
  })

  describe('getAllAddresses', function() {
    beforeEach(function() {
      am.setMasterKey(masterKeyBase58)
    })

    it('masterKey is undefined', function() {
      am.getMasterKey = function() { return undefined }
      var fn = function() { am.getAllAddresses() }
      expect(fn).to.throw(Error)
    })

    it('getAllAddresses once', function() {
      var address0 = am.getNewAddress().getAddress()
      var addresses = am.getAllAddresses().map(function(address) { return address.getAddress() })
      expect(addresses).to.deep.equal([address0])
    })
  })
})
