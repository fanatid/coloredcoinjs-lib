import { pseudoRandomBytes as getRandomBytes } from 'crypto'

import runImplementationTest from './implementation'

runImplementationTest({
  describe: describe,
  clsName: 'IndexedDB',
  clsOpts: {
    prefix: getRandomBytes(10).toString('hex')
  }
})
