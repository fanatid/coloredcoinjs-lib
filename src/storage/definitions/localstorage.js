import _ from 'lodash'
import { LocalStorage } from 'odd-storage'

import AbstractSyncColorDefinitionStorage from './abstractsync'

/**
 * @class ColorDefinitionLocalStorage
 * @extends AbstractSyncColorDefinitionStorage
 */
export default class ColorDefinitionLocalStorage extends AbstractSyncColorDefinitionStorage {
  /**
   * @constructor
   * @param {Object} [opts]
   * @param {string} [opts.prefix=cclib-definitions]
   */
  constructor (opts) {
    super(LocalStorage, _.extend({prefix: 'cclib-definitions'}, opts))
  }

  static isAvailable = LocalStorage.isAvailable
}
