import _ from 'lodash'
import { WebSQL as WebSQLStorage } from 'odd-storage'

import AbstractSQLColorDefinitionStorage from './abstractsql'

/**
 * @class ColorDefinitionWebSQLStorage
 * @extends AbstractSQLColorDefinitionStorage
 * @param {Object} [opts]
 * @param {string} [opts.dbName=cclib]
 * @param {number} [opts.dbSize=5] In MB
 */
export default class ColorDefinitionWebSQLStorage extends AbstractSQLColorDefinitionStorage {
  /**
   * @constructor
   */
  constructor (opts) {
    super(WebSQLStorage, _.extend({dbName: 'cclib', dbSize: 5}, opts))
  }

  static isAvailable = WebSQLStorage.isAvailable
}
