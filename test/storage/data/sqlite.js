/* global describe */
var cclib = require('../../../')

require('./implementation')({
  describe: describe.skip,
  StorageCls: cclib.storage.data.SQLite,
  storageOpts: {
    filename: ':memory:'
  }
})
