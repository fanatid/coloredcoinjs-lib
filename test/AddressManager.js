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
  var address1 = '1DTk8UthCEMT3AqGfjXUBAXLHcqRtGck1H'

  beforeEach(function() {
    amStore = new AddressManagerStore('memory')
    am = new AddressManager(amStore)
  })

  describe('setMasterKeyFromSeed', function() {
    it('from Buffer', function(done) {
      am.setMasterKeyFromSeed(new Buffer(seedHex, 'hex'), networks.bitcoin, function(error, changed) {
        expect(error).to.be.null
        expect(changed).to.be.true
        am.getMasterKey(function(error, masterKey) {
          expect(error).to.be.null
          expect(masterKey).to.equal(masterKeyBase58)
          done()
        })
      })
    })

    it('from Hex string', function(done) {
      am.setMasterKeyFromSeed(seedHex, networks.bitcoin, function(error, changed) {
        expect(error).to.be.null
        expect(changed).to.be.true
        am.getMasterKey(function(error, masterKey) {
          expect(error).to.be.null
          expect(masterKey).to.equal(masterKeyBase58)
          done()
        })
      })
    })
  })

  describe('getNewAddress', function() {
    beforeEach(function(done) {
      am.setMasterKey(masterKeyBase58, function(error, changed) {
        expect(error).to.be.null
        expect(changed).to.be.true
        done()
      })
    })

    it('getMasterKey return error', function(done) {
      am.getMasterKey = function(cb) { cb('error.getMasterKey') }
      am.getNewAddress(function(error, address) {
        expect(error).to.equal('error.getMasterKey')
        expect(address).to.be.undefined
        done()
      })
    })

    it('getMasterKey return null masterKey', function(done) {
      am.getMasterKey = function(cb) { cb(null, null) }
      am.getNewAddress(function(error, address) {
        expect(error).to.deep.equal(new Error('masterKey not found'))
        expect(address).to.be.undefined
        done()
      })
    })

    it('AddressManagerStore.getMaxIndex return error', function(done) {
      amStore.getMaxIndex = function(_, _, cb) { cb('error.getMaxIndex') }
      am.getNewAddress(function(error, address) {
        expect(error).to.equal('error.getMaxIndex')
        expect(address).to.be.undefined
        done()
      })
    })

    it('AddressManagerStore.addPubKey return error', function(done) {
      amStore.addPubKey = function(_, _, _, _, cb) { cb('error.addPubKey') }
      am.getNewAddress(function(error, address) {
        expect(error).to.equal('error.addPubKey')
        expect(address).to.be.undefined
        done()
      })
    })

    it('getNewAddress once', function(done) {
      am.getNewAddress(function(error, address) {
        expect(error).to.be.null
        expect(address.getAddress()).to.equal(address0)
        done()
      })
    })

    it('getNewAddress twice', function(done) {
      am.getNewAddress(function(error, address) {
        expect(error).to.be.null
        expect(address.getAddress()).to.equal(address0)
        am.getNewAddress(function(error, address) {
          expect(error).to.be.null
          expect(address.getAddress()).to.equal(address1)
          done()
        })
      })
    })

    it('AddressManagerStore.addPubKey added is false', function(done) {
      addPubKey = amStore.addPubKey
      amStore.addPubKey = function(_, _, _, _, cb) { amStore.addPubKey = addPubKey; cb(null, false) }
      am.getNewAddress(function(error, address) {
        expect(error).to.be.null
        expect(address.getAddress()).to.equal(address0)
        done()
      })
    })
  })

  describe('getAllAddresses', function() {
    beforeEach(function(done) {
      am.setMasterKey(masterKeyBase58, function(error, changed) {
        expect(error).to.be.null
        expect(changed).to.be.true
        done()
      })
    })

    it('getMasterKey return error', function(done) {
      am.getMasterKey = function(cb) { cb('error.getMasterKey') }
      am.getAllAddresses(function(error, addresses) {
        expect(error).to.equal('error.getMasterKey')
        expect(addresses).to.be.undefined
        done()
      })
    })

    it('getAllAddresses return null masterKey', function(done) {
      am.getMasterKey = function(cb) { cb(null, null) }
      am.getAllAddresses(function(error, addresses) {
        expect(error).to.deep.equal(new Error('masterKey not found'))
        expect(addresses).to.be.undefined
        done()
      })
    })

    it('AddressManagerStore.getAllPubKeys return error', function(done) {
      amStore.getAllPubKeys = function(_, _, cb) { cb('error.getAllPubKeys') }
      am.getAllAddresses(function(error, addresses) {
        expect(error).to.equal('error.getAllPubKeys')
        expect(addresses).to.be.undefined
        done()
      })
    })

    it('getAllAddresses', function(done) {
      am.getNewAddress(function(error, address) {
        expect(error).to.be.null
        expect(address.getAddress()).to.equal(address0)
        am.getAllAddresses(function(error, addresses) {
          expect(error).to.be.null
          addresses = addresses.map(function(address) { return address.getAddress() })
          expect(addresses).to.deep.equal([address0])
          done()
        })
      })
    })
  })
})
