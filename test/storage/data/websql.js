/* global describe */
'use strict'

require('./implementation')({
  describe: describe,
  clsName: 'WebSQL',
  clsOpts: {
    dbName: require('crypto').pseudoRandomBytes(5).toString('hex'),
    dbSize: 1
  }
})
