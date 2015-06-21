/* global describe */
'use strict'

require('./implementation')({
  describe: describe,
  clsName: 'PostgreSQL',
  clsOpts: require('../../config/postgresql.json')
})
