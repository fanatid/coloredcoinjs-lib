var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')
var ECPubKey = bitcoin.ECPubKey
var networks = bitcoin.networks

var coloredcoinlib = require('../src/index')
var Address = coloredcoinlib.Address
var blockchain = coloredcoinlib.blockchain
var ColorData = coloredcoinlib.ColorData
var colordef = coloredcoinlib.colordef
var ColorValue = coloredcoinlib.ColorValue
var store = coloredcoinlib.store


describe('Address', function() {
  var address
  var pubKey0 =  ECPubKey.fromHex('021c10af30f8380f1ff05a02e10a69bd323a7305c43dc461f79c2b27c13532a12c')

  describe('getAddress', function() {
    it('for bitcoin', function() {
      address = new Address({ pubKey: pubKey0, network: networks.bitcoin })
      expect(address.getAddress()).to.equal('18KMigSHDPVFzsgWe1mcaPPA5wSY3Ur5wS')
    })

    it('for testnet', function() {
      address = new Address({ pubKey: pubKey0, network: networks.testnet })
      expect(address.getAddress()).to.equal('mnqK1jXG2QvWmzA8MajzQJbUww3ExLrWTA')
    })
  })

  describe('getBalance', function() {
    var bs, cdStore, cData, epobc, address

    this.timeout(5000)

    beforeEach(function() {
      cdStore = new store.ColorDataStore()
      bs = new blockchain.BlockrIOAPI({ testnet: true })
      cData = new ColorData({ cdStore: cdStore, blockchain: bs })
      address = new Address({ pubKey: pubKey0, network: networks.testnet })
      epobc = colordef.EPOBCColorDefinition.fromScheme({ colorId: 1 },
        'epobc:e28907304807b7b01c09c23dc09b76968d66c3c7f75359c1c37e90e0015f1dbc:0:271191')
    })

    it('getUTXO return error', function(done) {
      bs.getUTXO = function(_, cb) { cb('error.blockchain') }
      epobc = colordef.EPOBCColorDefinition.fromScheme({ colorId: 1 },
        'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0')
      address.getBalance({ colorData: cData, blockchain: bs, colorDefinition: epobc }, function(error, result) {
        expect(error).to.equal('error.blockchain')
        expect(result).to.be.undefined
        done()
      })
    })

    it('getColorValue return error', function(done) {
      cData.getColorValue = function(_, _, _, cb) { cb('error.getColorValue') }
      address.getAddress = function() { return 'mtwcUY5zfQwgLdrCNDq9JiYAu54h257RA1' }
      address.getBalance({ colorData: cData, blockchain: bs, colorDefinition: epobc }, function(error, result) {
        expect(error).to.equal('error.getColorValue')
        expect(result).to.be.undefined
        done()
      })
    })

    it.skip('uncolored', function(done) {
      address.getAddress = function() { return 'mjk8yZ2X2rJyMGXFojfYqSLpuLRzYRuGSo' }
      address.getBalance({ colorData: cData, blockchain: bs, colorDefinition: colordef.uncoloredMarker }, function(error, result) {
        // Todo
        console.log(error, result)
        done()
      })
    })

    it('genesis tx', function(done) {
      address.getAddress = function() { return 'mtwcUY5zfQwgLdrCNDq9JiYAu54h257RA1' }
      address.getBalance({ colorData: cData, blockchain: bs, colorDefinition: epobc }, function(error, result) {
        expect(error).to.be.null
        expect(result).to.deep.equal({
          confirmed: new ColorValue({ colordef: epobc, value: 500000 }),
          unconfirmed: new ColorValue({ colordef: epobc, value: 0 })
        })
        done()
      })
    })

    it('sended from genesis', function(done) {
      address.getAddress = function() { return 'n2DMTwPLkcMb8xNRhmn2JWF685C8CFveq7' }
      address.getBalance({ colorData: cData, blockchain: bs, colorDefinition: epobc }, function(error, result) {
        expect(error).to.be.null
        expect(result).to.deep.equal({
          confirmed: new ColorValue({ colordef: epobc, value: 250000 }),
          unconfirmed: new ColorValue({ colordef: epobc, value: 0 })
        })
        done()
      })
    })

    it('sended from from genesis', function(done) {
      address.getAddress = function() { return 'mgrJK2ze4TJVjDGk2WahfhatA1D1T2ejgK' }
      address.getBalance({ colorData: cData, blockchain: bs, colorDefinition: epobc }, function(error, result) {
        expect(error).to.be.null
        expect(result).to.deep.equal({
          confirmed: new ColorValue({ colordef: epobc, value: 250000 }),
          unconfirmed: new ColorValue({ colordef: epobc, value: 0 })
        })
        done()
      })
    })
  })
})
