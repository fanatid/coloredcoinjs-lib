import _ from 'lodash'
import { WebSQL as WebSQLStorage } from 'odd-storage'

import AbstractSQLColorDataStorage from './abstractsql'

/**
 * @class ColorDataWebSQLStorage
 * @extends AbstractSQLColorDataStorage
 */
export default class ColorDataWebSQLStorage extends AbstractSQLColorDataStorage {
  /**
   * @constructor
   * @param {Object} [opts]
   * @param {string} [opts.dbName=cclib]
   * @param {number} [opts.dbSize=50] In MB
   */
  constructor (opts) {
    super(WebSQLStorage, _.extend({dbName: 'cclib', dbSize: 50}, opts))
  }

  static isAvailable = WebSQLStorage.isAvailable
}
