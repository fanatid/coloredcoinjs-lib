import _ from 'lodash'
import { SQLite as SQLiteStorage } from 'odd-storage'

import AbstractSQLColorDefinitionStorage from './abstractsql'

/**
 * @class ColorDefinitionSQLiteStorage
 * @extends AbstractSQLColorDefinitionStorage
 */
export default class ColorDefinitionSQLiteStorage extends AbstractSQLColorDefinitionStorage {
  /**
   * @constructor
   * @param {Object} [opts]
   * @param {string} [opts.filename=cclib.sqlite3]
   */
  constructor (opts) {
    super(SQLiteStorage, _.extend({filename: 'cclib.sqlite3'}, opts))
  }

  static isAvailable = SQLiteStorage.isAvailable
}
