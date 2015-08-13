import runImplementationTest from './implementation'

runImplementationTest({
  describe: describe,
  clsName: 'PostgreSQL',
  clsOpts: require('../../config/postgresql.json')
})
