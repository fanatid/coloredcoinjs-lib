import _ from 'lodash'
import { IndexedDB as IndexedDBStorage } from 'odd-storage'

import AbstractSyncColorDataStorage from './abstractsync'

/**
 * @class ColorDataIndexedDBStorage
 * @extends AbstractSyncColorDataStorage
 */
export default class ColorDataIndexedDBStorage extends AbstractSyncColorDataStorage {
  /**
   * @constructor
   * @param {Object} [opts]
   * @param {string} [opts.dbName]
   */
  constructor (opts) {
    super(IndexedDBStorage, _.extend({dbName: 'cclib-data'}, opts))
  }

  static isAvailable = IndexedDBStorage.isAvailable
}
