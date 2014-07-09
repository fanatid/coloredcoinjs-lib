var expect = require('chai').expect

var bitcoin = require('bitcoinjs-lib')

var coloredcoinlib = require('../src/index')


describe('blockchain', function() {
  describe('BlockchaininfoDataAPI', function() {
    var bs

    var rawTx = {
      'c6c606f7b584b7f13cc50b823875c4ec3a4ac04f7bfc66790e25cc6281b25e48': '\
010000000126b77c90dff8b58d27e4e00c7e73df612df69f83c106d1aefbb20137b1d3ff1801000\
0008b483045022100f3dc71270e2c0dcdfae8242b0aaf42680296e7975d10c61cc32412b9d49257\
af02207538621932e0bf63767143c44729a9ac712ce99fb3a72148f455c1cf11352da6014104250\
d1ef07e0d9bc58d9d52bb8e642e63468cbc1fc179eccfe2bbe261bf0df06527cdd170c1d8c4c005\
5e4d6df6adcebdf86052b7e2279fbfceb1ef63794cc656ffffffff023435f600000000001976a91\
4602933102e619fd8487a7a874b968c04890ebd1b88ac1790d004000000001976a914f967e52ac8\
6bb648792e706985d5f98ace722b6288ac00000000'
    }

    beforeEach(function() {
      bs = new coloredcoinlib.blockchain.BlockchaininfoDataAPI()
    })

    it('raw request with cors in params', function(done) {
      bs.request('/latestblock?cors=false', function(error, response) {
        expect(error).to.be.null
        expect(response).to.be.a('string')
        done()
      })
    })

    it('getBlockCount', function(done) {
      bs.getBlockCount(function(error, response) {
        expect(error).to.be.null
        expect(response).to.be.a('number')
        expect(response).to.be.at.least(0)
        done()
      })
    })

    it('getBlockCount with bad height', function(done) {
      bs.request = function(path, cb) { cb(null, JSON.stringify({ 'height': 'notNumber' })) }
      bs.getBlockCount(function(error, response) {
        expect(error).to.equal('heght not number')
        expect(response).to.be.null
        done()
      })
    })

    it('getBlockCount with error', function(done) {
      bs.request = function(path, cb) { cb('myError', null) }
      bs.getBlockCount(function(error, response) {
        expect(error).to.equal('myError')
        expect(response).to.be.null
        done()
      })
    })

    it('getRawTx', function(done) {
      bs.getRawTx('c6c606f7b584b7f13cc50b823875c4ec3a4ac04f7bfc66790e25cc6281b25e48', function(error, response) {
        expect(error).to.be.null
        expect(response).to.be.equal(
          rawTx['c6c606f7b584b7f13cc50b823875c4ec3a4ac04f7bfc66790e25cc6281b25e48'])
        done()
      })
    })

    it('getRawTx with error', function(done) {
      bs.request = function(path, cb) { cb('myError', null) }
      bs.getRawTx('c6c606f7b584b7f13cc50b823875c4ec3a4ac04f7bfc66790e25cc6281b25e48', function(error, response) {
        expect(error).to.equal('myError')
        expect(response).to.be.null
        done()
      })
    })

    it ('getTx', function(done) {
      bs.getTx('c6c606f7b584b7f13cc50b823875c4ec3a4ac04f7bfc66790e25cc6281b25e48', function(error, response) {
        expect(error).to.be.null
        expect(response).to.deep.equal(
          bitcoin.Transaction.fromHex(rawTx['c6c606f7b584b7f13cc50b823875c4ec3a4ac04f7bfc66790e25cc6281b25e48']))
        done()
      })
    })

    it('getTx with bad Transaction', function(done) {
      bs.request = function(path, cb) { cb(null, '') }
      bs.getTx('unknow tx', function(error, response) {
        expect(error).not.to.be.null
        expect(response).to.be.null
        done()
      })
    })

    it('getTx with error', function(done) {
      bs.request = function(path, cb) { cb('myError', null) }
      bs.getTx('unknow tx', function(error, response) {
        expect(error).to.equal('myError')
        expect(response).to.be.null
        done()
      })
    })
  })
})
