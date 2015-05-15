/* global describe */
var localStorage = require('localStorage')
var random = require('bitcore').crypto.Random

var cclib = require('../../../')

if (!cclib.storage.definitions.LocalStorage.isAvailable()) {
  global.localStorage = localStorage
}

require('./implementation')({
  describe: describe,
  StorageCls: cclib.storage.definitions.LocalStorage,
  storageOpts: {
    prefix: random.getRandomBuffer(10).toString('hex')
  }
})
