import _ from 'lodash'
import { IndexedDB as IndexedDBStorage } from 'odd-storage'

import AbstractSyncColorDefinitionStorage from './abstractsync'

/**
 * @class ColorDefinitionIndexedDBStorage
 * @extends AbstractSyncColorDefinitionStorage
 */
export default class ColorDefinitionIndexedDBStorage extends AbstractSyncColorDefinitionStorage {
  /**
   * @constructor
   * @param {Object} [opts]
   * @param {string} [opts.dbName=cclib-definitions]
   */
  constructor (opts) {
    super(IndexedDBStorage, _.extend({dbName: 'cclib-definitions'}, opts))
  }

  static isAvailable = IndexedDBStorage.isAvailable
}
