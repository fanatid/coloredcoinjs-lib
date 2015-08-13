import { Memory as MemoryStorage } from 'odd-storage'

import AbstractSyncColorDefinitionStorage from './abstractsync'

/**
 * @class ColorDefinitionMemoryStorage
 * @extends AbstractSyncColorDefinitionStorage
 */
export default class ColorDefinitionMemoryStorage extends AbstractSyncColorDefinitionStorage {
  /**
   * @constructor
   */
  constructor () {
    super(MemoryStorage)
  }

  static isAvailable = MemoryStorage.isAvailable
}
