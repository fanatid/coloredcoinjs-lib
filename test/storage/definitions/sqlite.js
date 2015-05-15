/* global describe */
var cclib = require('../../../')

require('./implementation')({
  describe: describe,
  StorageCls: cclib.storage.definitions.SQLite,
  storageOpts: {
    filename: ':memory:'
  }
})
