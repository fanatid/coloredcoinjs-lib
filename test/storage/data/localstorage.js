/* global describe */
var localStorage = require('localStorage')
var random = require('bitcore').crypto.Random

var cclib = require('../../../')

if (!cclib.storage.data.LocalStorage.isAvailable()) {
  global.localStorage = localStorage
}

require('./implementation')({
  describe: describe,
  StorageCls: cclib.storage.data.LocalStorage,
  storageOpts: {
    prefix: random.getRandomBuffer(10).toString('hex')
  }
})
