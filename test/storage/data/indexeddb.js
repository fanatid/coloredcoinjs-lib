/* global describe */
'use strict'

require('./implementation')({
  describe: describe,
  clsName: 'IndexedDB',
  clsOpts: {
    dbName: require('crypto').pseudoRandomBytes(5).toString('hex')
  }
})
