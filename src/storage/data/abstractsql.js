import _ from 'lodash'

import { PostgreSQL as PostgreSQLStorage } from 'odd-storage'

import IDataStorage from './interface'
import errors from '../../errors'

let SQL = {}

SQL['SQLite'] = {
  create: {
    table: `CREATE TABLE IF NOT EXISTS cclib_data (
              color_id INTEGER NOT NULL,
              color_code TEXT NOT NULL,
              txid TEXT NOT NULL,
              oidx INTEGER NOT NULL,
              value TEXT NOT NULL,
              PRIMARY KEY (color_id, txid, oidx))`,
    index: `CREATE INDEX IF NOT EXISTS
              cclib_data_idx
            ON
              cclib_data (color_code, txid)`
  },
  insert: `INSERT INTO cclib_data
             (color_id, color_code, txid, oidx, value)
           VALUES
             ($1, $2, $3, $4, $5)`,
  select: {
    all: `SELECT
            *
          FROM
            cclib_data
          WHERE
            color_code = $1 AND
            txid = $2`,
    outIndexFilter: `SELECT
                       *
                     FROM
                       cclib_data
                     WHERE
                       color_code = $1 AND
                       txid = $2 AND
                       oidx = $3`,
    value: `SELECT
              value
            FROM
              cclib_data
            WHERE
              color_id = $1 AND
              color_code = $2 AND
              txid = $3 AND
              oidx = $4`
  },
  delete: {
    byCodeAndTxId: 'DELETE FROM cclib_data WHERE color_code = $1 AND txid = $2',
    byColorId: 'DELETE FROM cclib_data WHERE color_id = $1',
    all: 'DELETE FROM cclib_data'
  }
}

SQL['PostgreSQL'] = _.cloneDeep(SQL['SQLite'])
SQL['PostgreSQL'].create.index =
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1
         FROM pg_class c
         JOIN pg_namespace n
         ON n.oid = c.relnamespace
         WHERE c.relname = 'cclib_data_idx'
         AND n.nspname = 'public'
     ) THEN
     CREATE INDEX cclib_data_idx ON cclib_data (color_code, txid);
   END IF;
   END$$;`

/**
 * @class AbstractSyncColorDataStorage
 * @extends IColorDataStorage
 */
export default class AbstractSyncColorDataStorage extends IDataStorage {
  /**
   * @constructor
   * @param {function} StorageCls
   * @param {Object} storageOpts
   */
  constructor (StorageCls, storageOpts) {
    super()

    this._SQL = SQL['SQLite']
    if (StorageCls === PostgreSQLStorage) {
      this._SQL = SQL['PostgreSQL']
    }

    this._storage = new StorageCls(storageOpts)
    this._storage.open()
      .then(() => {
        return this._storage.withLock(async () => {
          await this._storage.executeSQL(this._SQL.create.table)
          await this._storage.executeSQL(this._SQL.create.index)
        })
      })
      .then(() => this._ready(null), (err) => this._ready(err))
  }

  /**
   * @param {IDataStorage~Record} data
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async add (data, opts) {
    await this.ready

    await this._storage.withLock(async () => {
      let executeOpts = _.get(opts, 'executeOpts')

      let params = [data.colorId, data.colorCode, data.txId, data.outIndex]
      let value = JSON.stringify(data.value)

      // are we have another value for colorCode, txId, outIndex, colorId ?
      let rows = await this._storage.executeSQL(this._SQL.select.value, params, executeOpts)
      if (rows.length > 0) {
        if (rows[0].value === value) {
          return
        }

        throw new errors.Storage.ColorData.HaveAnotherValue(
          data.txId, data.outIndex, data.colorId, data.colorCode, rows[0].value)
      }

      params.push(value)
      await this._storage.executeSQL(this._SQL.insert, params, executeOpts)
    })
  }

  /**
   * @param {Object} data
   * @param {string} data.colorCode
   * @param {string} data.txId
   * @param {number} [data.outIndex]
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<Map<number, Map<number, *>>>}
   */
  async get (data, opts) {
    await this.ready

    let rows = await this._storage.withLock(() => {
      let sql = this._SQL.select.all
      let params = [data.colorCode, data.txId]

      if (data.outIndex !== undefined) {
        sql = this._SQL.select.outIndexFilter
        params = [data.colorCode, data.txId, data.outIndex]
      }

      return this._storage.executeSQL(sql, params, _.get(opts, 'executeOpts'))
    })

    return rows.reduce((result, row) => {
      if (!result.has(row.oidx)) {
        result.set(row.oidx, new Map())
      }

      result.get(row.oidx).set(row.color_id, JSON.parse(row.value))
      return result
    }, new Map())
  }

  /**
   * @param {Object} data
   * @param {string} [data.colorCode]
   * @param {string} [data.txId]
   * @param {number} [data.colorId]
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async remove (data, opts) {
    await this.ready

    await this._storage.withLock(async (tx) => {
      let query = this._SQL.delete.byCodeAndTxId
      let params = [data.colorCode, data.txId]
      if (data.colorId !== undefined) {
        query = this._SQL.delete.byColorId
        params = [data.colorId]
      }

      await this._storage.executeSQL(query, params, _.get(opts, 'executeOpts'))
    })
  }

  /**
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async clear (opts) {
    await this.ready

    await this._storage.withLock(async () => {
      await this._storage.executeSQL(
        this._SQL.delete.all, [], _.get(opts, 'executeOpts'))
    })
  }
}
