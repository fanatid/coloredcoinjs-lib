import _ from 'lodash'
import { LocalStorage } from 'odd-storage'

import AbstractSyncColorDataStorage from './abstractsync'

/**
 * @class ColorDataLocalStorage
 * @extends AbstractSyncColorDataStorage
 */
export default class ColorDataLocalStorage extends AbstractSyncColorDataStorage {
  /**
   * @constructor
   * @param {Object} [opts]
   * @param {string} [opts.prefix=cclib-data]
   */
  constructor (opts) {
    super(LocalStorage, _.extend({prefix: 'cclib-data'}, opts))
  }

  static isAvailable = LocalStorage.isAvailable
}
