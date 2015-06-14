/* global describe */
'use strict'

var cclib = require('../../../')

require('./implementation')({
  describe: describe,
  StorageCls: cclib.storage.data.SQLite,
  storageOpts: {
    filename: ':memory:'
  }
})
