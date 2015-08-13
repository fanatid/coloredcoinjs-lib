import _ from 'lodash'
import { SQLite as SQLiteStorage } from 'odd-storage'

import AbstractSQLColorDataStorage from './abstractsql'

/**
 * @class ColorDataSQLiteStorage
 * @extends AbstractSQLColorDataStorage
 */
export default class ColorDataSQLiteStorage extends AbstractSQLColorDataStorage {
  /**
   * @constructor
   * @param {Object} [opts]
   * @param {string} [opts.filename=cclib.sqlite3]
   */
  constructor (opts) {
    super(SQLiteStorage, _.extend({filename: 'cclib.sqlite'}, opts))
  }

  static isAvailable = SQLiteStorage.isAvailable
}
