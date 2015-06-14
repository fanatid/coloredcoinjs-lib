/* global describe */
'use strict'

var random = require('bitcore').crypto.Random

var cclib = require('../../../')

require('./implementation')({
  describe: describe,
  StorageCls: cclib.storage.definitions.LocalStorage,
  storageOpts: {
    prefix: random.getRandomBuffer(10).toString('hex')
  }
})
