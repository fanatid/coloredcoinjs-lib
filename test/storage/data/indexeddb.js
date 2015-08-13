import { pseudoRandomBytes as getRandomBytes } from 'crypto'

import runImplementationTest from './implementation'

runImplementationTest({
  describe: describe,
  clsName: 'IndexedDB',
  clsOpts: {
    dbName: getRandomBytes(5).toString('hex')
  }
})
