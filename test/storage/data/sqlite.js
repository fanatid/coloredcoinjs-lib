/* global describe */
'use strict'

require('./implementation')({
  describe: describe,
  clsName: 'SQLite',
  clsOpts: {
    filename: ':memory:'
  }
})
