import { PostgreSQL as PostgreSQLStorage } from 'odd-storage'

import AbstractSQLColorDataStorage from './abstractsql'

/**
 * @class ColorDataPostgreSQLStorage
 * @extends AbstractSQLColorDataStorage
 */
export default class ColorDataPostgreSQLStorage extends AbstractSQLColorDataStorage {
  /**
   * @constructor
   * @param {Object} opts
   * @param {string} opts.url
   * @param {boolean} [opts.native=false]
   */
  constructor (opts) {
    super(PostgreSQLStorage, opts)
  }

  static isAvailable = PostgreSQLStorage.isAvailable
}
