/* global describe, it */
var expect = require('chai').expect
var bitcore = require('bitcore')

var cclib = require('../../')

describe('util.bitcoin', function () {
  describe('script2addresses', function () {
    var network = bitcore.Networks.testnet

    function checkScript (asm, addresses) {
      var script = bitcore.Script(asm)
      var result = cclib.util.bitcoin.script2addresses(script, network)
      expect(result).to.deep.equal(addresses)
    }

    it('p2kh', function () {
      var script = '76a9143705495191e0a8445e88fbe8321a20311b2bd9b088ac'
      var addresses = ['mkXsnukPxC8FuEFEWvQdJNt6gvMDpM8Ho2']
      checkScript(script, addresses)
    })

    it('p2pk', function () {
      var script = '210292e76f6d718dae61dbd608b0ef492a40a086986d5560c1a0aeef411ba73de6e9ac'
      var addresses = ['mkXsnukPxC8FuEFEWvQdJNt6gvMDpM8Ho2']
      checkScript(script, addresses)
    })

    it('multisig', function () {
      var script = '52210292e76f6d718dae61dbd608b0ef492a40a086986d5560c1a0aeef411ba73de6e9210364341ef4b61de850ad0a3ffb37b98779292664b7287662df00eaf8e4e86288e352ae'
      var addresses = [
        'mkXsnukPxC8FuEFEWvQdJNt6gvMDpM8Ho2',
        'n3E3sYxTwz4FCU3LdUnKiiG1PTcPC654Za'
      ]
      checkScript(script, addresses)
    })

    it('p2sh', function () {
      var script = 'a9143705495191e0a8445e88fbe8321a20311b2bd9b087'
      var addresses = ['2MxG9V95tJXWjR56bbaiiX31yBoFQFJBfUu']
      checkScript(script, addresses)
    })
  })
})
