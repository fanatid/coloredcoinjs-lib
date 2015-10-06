import _ from 'lodash'

import { PostgreSQL as PostgreSQLStorage } from 'odd-storage'

import IDataStorage from './interface'
import errors from '../../errors'

let SQL = {}

SQL['SQLite'] = {
  create: {
    tables: {
      tx: `CREATE TABLE IF NOT EXISTS cclib_data_tx (
             pk INTEGER PRIMARY KEY AUTOINCREMENT,
             color_code TEXT NOT NULL,
             txid TEXT NOT NULL)`,
      values: `CREATE TABLE IF NOT EXISTS cclib_data_values (
                 oidx INTEGER NOT NULL,
                 color_id INTEGER NOT NULL,
                 value TEXT NOT NULL,
                 tx_pk INTEGER NOT NULL,
                 FOREIGN KEY (tx_pk) REFERENCES cclib_data_tx(pk))`
    },
    indices: {
      tx: `CREATE INDEX IF NOT EXISTS
             cclib_data_tx_idx
           ON
             cclib_data_tx (txid, color_code)`
    }
  },
  insert: {
    tx: `INSERT INTO cclib_data_tx
           (color_code, txid)
         VALUES
           ($1, $2)`,
    value: `INSERT INTO cclib_data_values
              (oidx, color_id, value, tx_pk)
            VALUES
              ($1, $2, $3, $4)`
  },
  select: {
    pk: `SELECT
           pk
         FROM
           cclib_data_tx
         WHERE
           color_code = $1 AND
           txid = $2`,
    value: `SELECT
              cclib_data_values.value
            FROM
              cclib_data_tx
            JOIN
              cclib_data_values
            ON
              cclib_data_values.tx_pk = cclib_data_tx.pk
            WHERE
              cclib_data_tx.color_code = $1 AND
              cclib_data_tx.txid = $2 AND
              cclib_data_values.oidx = $3 AND
              cclib_data_values.color_id = $4`,
    all: `SELECT
            *
          FROM
            cclib_data_tx
          JOIN
            cclib_data_values
          ON
            cclib_data_values.tx_pk = cclib_data_tx.pk
          WHERE
            cclib_data_tx.color_code = $1 AND
            cclib_data_tx.txid = $2`,
    outIndexFilter: `SELECT
                       *
                     FROM
                       cclib_data_tx
                     JOIN
                       cclib_data_values
                     ON
                       cclib_data_values.tx_pk = cclib_data_tx.pk
                     WHERE
                       cclib_data_tx.color_code = $1 AND
                       cclib_data_tx.txid = $2 AND
                       cclib_data_values.oidx = $3`
  },
  delete: {
    tx: `DELETE FROM cclib_data_tx WHERE pk = $1`,
    values: `DELETE FROM cclib_data_values WHERE tx_pk = $1`,
    all: {
      tx: `DELETE FROM cclib_data_tx`,
      values: `DELETE FROM cclib_data_values`
    }
  }
}

SQL['PostgreSQL'] = _.cloneDeep(SQL['SQLite'])
SQL['PostgreSQL'].create.tables.tx =
  `CREATE TABLE IF NOT EXISTS cclib_data_tx (
     pk SERIAL PRIMARY KEY,
     color_code TEXT NOT NULL,
     txid TEXT NOT NULL)`
SQL['PostgreSQL'].create.indices.tx =
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1
         FROM pg_class c
         JOIN pg_namespace n
         ON n.oid = c.relnamespace
         WHERE c.relname = 'cclib_data_tx_idx'
         AND n.nspname = 'public'
     ) THEN
     CREATE INDEX cclib_data_tx_idx ON cclib_data_tx (txid, color_code);
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
          await this._storage.executeSQL(this._SQL.create.tables.tx)
          await this._storage.executeSQL(this._SQL.create.tables.values)
          await this._storage.executeSQL(this._SQL.create.indices.tx)
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

      let params = [data.colorCode, data.txId, data.outIndex, data.colorId]
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

      let getPK = async () => {
        params = [data.colorCode, data.txId]
        let rows = await this._storage.executeSQL(this._SQL.select.pk, params, executeOpts)
        return rows.length === 0 ? null : rows[0].pk
      }

      // save
      let pk = await getPK()
      if (pk === null) {
        params = [data.colorCode, data.txId]
        await this._storage.executeSQL(this._SQL.insert.tx, params, executeOpts)
        pk = await getPK()
      }

      params = [data.outIndex, data.colorId, data.value, pk]
      await this._storage.executeSQL(this._SQL.insert.value, params, executeOpts)
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
   * @param {string} data.colorCode
   * @param {string} data.txId
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async remove (data, opts) {
    await this.ready
    await this._storage.withLock(async (tx) => {
      let executeOpts = _.get(opts, 'executeOpts')

      let params = [data.colorCode, data.txId]
      let rows = await this._storage.executeSQL(this._SQL.select.pk, params, executeOpts)
      if (rows.length !== 1) {
        return
      }

      await this._storage.executeSQL(this._SQL.delete.values, [rows[0].pk], executeOpts)
      await this._storage.executeSQL(this._SQL.delete.tx, [rows[0].pk], executeOpts)
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
      let executeOpts = _.get(opts, 'executeOpts')

      await this._storage.executeSQL(this._SQL.delete.all.values, [], executeOpts)
      await this._storage.executeSQL(this._SQL.delete.all.tx, [], executeOpts)
    })
  }
}
