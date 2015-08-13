import runImplementationTest from './implementation'

runImplementationTest({
  describe: describe,
  clsName: 'SQLite',
  clsOpts: {
    filename: ':memory:'
  }
})
