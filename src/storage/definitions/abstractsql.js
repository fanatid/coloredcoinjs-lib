import _ from 'lodash'
import { PostgreSQL as PostgreSQLStorage } from 'odd-storage'

import IColorDefinitionStorage from './interface'

let SQL = {}

SQL['SQLite'] = {
  create: `CREATE TABLE IF NOT EXISTS cclib_definitions (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             cdesc TEXT NOT NULL UNIQUE)`,
  insert: `INSERT INTO cclib_definitions (cdesc) VALUES ($1)`,
  select: {
    resolve: `SELECT cdesc, id FROM cclib_definitions WHERE cdesc = $1`,
    last: `SELECT cdesc, id FROM cclib_definitions ORDER BY id DESC LIMIT 1`,
    getById: `SELECT cdesc, id FROM cclib_definitions WHERE id = $1`,
    getAll: `SELECT cdesc, id FROM cclib_definitions`
  },
  delete: {
    all: `DELETE FROM cclib_definitions`
  }
}

SQL['PostgreSQL'] = _.cloneDeep(SQL['SQLite'])
SQL['PostgreSQL'].create = `CREATE TABLE IF NOT EXISTS cclib_definitions (
                              id SERIAL PRIMARY KEY,
                              cdesc TEXT NOT NULL UNIQUE)`

/**
 * @class AbstractSQLColorDefinitionStorage
 * @extends IColorDefinitionStorage
 */
export default class AbstractSQLColorDefinitionStorage extends IColorDefinitionStorage {
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
        return this._storage.withLock(() => {
          return this._storage.executeSQL(this._SQL.create)
        })
      })
      .then(() => { this._ready(null) }, (err) => { this._ready(err) })
  }

  /**
   * @param {string} desc
   * @param {Object} [opts]
   * @param {boolean} [opts.autoAdd=true]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<{record: ?IColorDefinitionStorage~Record, new: ?boolean}>}
   */
  async resolve (desc, opts) {
    await this.ready
    return await this._storage.withLock(async () => {
      let rows = await this._storage.executeSQL(
        this._SQL.select.resolve, [desc], executeOpts)
      if (rows.length !== 0) {
        return {record: {id: rows[0].id, desc: desc}, new: false}
      }

      let autoAdd = _.get(opts, 'autoAdd', true)
      if (!autoAdd) {
        return {record: null, new: null}
      }

      let executeOpts = _.get(opts, 'executeOpts')
      await this._storage.executeSQL(this._SQL.insert, [desc], executeOpts)
      rows = await this._storage.executeSQL(this._SQL.select.last, [], executeOpts)
      return {record: {id: rows[0].id, desc: desc}, new: true}
    })
  }

  /**
   * @param {Object} data
   * @param {number} [data.id]
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<(
   *   ?IColorDefinitionStorage~Record|
   *   IColorDefinitionStorage~Record[]
   * )>}
   */
  async get (data, opts) {
    await this.ready
    return await this._storage.withLock(async () => {
      if (_.has(data, 'id')) {
        let rows = await this._storage.executeSQL(
          this._SQL.select.getById, [data.id], _.get(opts, 'executeOpts'))
        if (rows.length === 0) {
          return null
        }

        return {id: rows[0].id, desc: rows[0].cdesc}
      }

      let rows = await this._storage.executeSQL(
        this._SQL.select.getAll, [], _.get(opts, 'executeOpts'))
      return rows.map((row) => { return {id: row.id, desc: row.cdesc} })
    })
  }

  /**
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async clear (opts) {
    await this.ready
    await this._storage.withLock(() => {
      return this._storage.executeSQL(this._SQL.delete.all, [], _.get(opts, 'executeOpts'))
    })
  }
}
