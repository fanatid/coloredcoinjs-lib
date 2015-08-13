import { PostgreSQL as PostgreSQLStorage } from 'odd-storage'

import AbstractSQLColorDefinitionStorage from './abstractsql'

/**
 * @class ColorDefinitionPostgreSQLStorage
 * @extends AbstractSQLColorDefinitionStorage
 */
export default class ColorDefinitionPostgreSQLStorage extends AbstractSQLColorDefinitionStorage {
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
