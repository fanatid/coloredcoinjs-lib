/* global describe */
var random = require('bitcore').crypto.Random

var cclib = require('../../../')

require('./implementation')({
  describe: describe.skip,
  StorageCls: cclib.storage.data.WebSQL,
  storageOpts: {
    dbName: random.getRandomBuffer(5).toString('hex'),
    dbSize: 1
  }
})
