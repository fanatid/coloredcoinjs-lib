import { pseudoRandomBytes as getRandomBytes } from 'crypto'

import runImplementationTest from './implementation'

runImplementationTest({
  describe: describe,
  clsName: 'LocalStorage',
  clsOpts: {
    prefix: getRandomBytes(10).toString('hex')
  }
})
