import { Memory as MemoryStorage } from 'odd-storage'

import AbstractSyncColorDataStorage from './abstractsync'

/**
 * @class ColorDataMemoryStorage
 * @extends AbstractSyncColorDataStorage
 */
export default class ColorDataMemoryStorage extends AbstractSyncColorDataStorage {
  /**
   * @constructor
   */
  constructor () {
    super(MemoryStorage)
  }

  static isAvailable = MemoryStorage.isAvailable
}
