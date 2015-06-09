var _ = require('lodash')
var inherits = require('util').inherits

var IColorDefinitionStorage = require('./interface')

var SQL = {
  create: 'CREATE TABLE IF NOT EXISTS color_definitions ( ' +
          '  id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
          '  desc TEXT NOT NULL UNIQUE)',
  insert: 'INSERT INTO color_definitions (desc) VALUES ($1)',
  select: {
    resolve: 'SELECT desc, id FROM color_definitions WHERE desc = $1',
    last: 'SELECT desc, id FROM color_definitions ORDER BY id DESC LIMIT 1',
    getById: 'SELECT desc, id FROM color_definitions WHERE id = $1',
    getAll: 'SELECT desc, id FROM color_definitions'
  },
  delete: {
    all: 'DELETE FROM color_definitions'
  }
}

/**
 * @class AbstractSQLColorDefinitionStorage
 * @extends IColorDefinitionStorage
 * @param {IStorageProvider} storageProvider
 */
function AbstractSQLColorDefinitionStorage (storageProvider) {
  var self = this
  IColorDefinitionStorage.call(self)

  self._storage = storageProvider
  self._storage.open()
    .then(function () {
      return self._storage.transaction(function () {
        return self._storage.executeSQL(SQL.create)
      })
    })
    .done(function () { self._ready() },
          function (err) { self._ready(err) })
}

inherits(AbstractSQLColorDefinitionStorage, IColorDefinitionStorage)
_.extend(AbstractSQLColorDefinitionStorage, IColorDefinitionStorage)

/**
 * @param {string} desc
 * @param {Object} [opts]
 * @param {boolean} [opts.autoAdd=true]
 * @return {Promise.<{record: ?IColorDefinitionStorage~Record, new: ?boolean}>}
 */
AbstractSQLColorDefinitionStorage.prototype.resolve =
function (desc, opts) {
  var storage = this._storage
  return storage.transaction(function () {
    return storage.executeSQL(SQL.select.resolve, [desc])
      .then(function (rows) {
        if (rows.length !== 0) {
          return {record: {id: rows[0].id, desc: desc}, new: false}
        }

        var autoAdd = Object(opts).autoAdd
        if (!autoAdd && autoAdd !== undefined) {
          return {record: null, new: null}
        }

        return storage.executeSQL(SQL.insert, [desc])
          .then(function () {
            return storage.executeSQL(SQL.select.last)
          })
          .then(function (rows) {
            return {record: {id: rows[0].id, desc: desc}, new: true}
          })
      })
  })
}

/**
 * @param {Object} [opts]
 * @param {number} [opts.id]
 * @return {Promise.<(
 *   ?IColorDefinitionStorage~Record|
 *   IColorDefinitionStorage~Record[]
 * )>}
 */
AbstractSQLColorDefinitionStorage.prototype.get = function (opts) {
  var storage = this._storage
  return storage.transaction(function () {
    var id = Object(opts).id
    if (id !== undefined) {
      return storage.executeSQL(SQL.select.getById, [id])
        .then(function (rows) {
          if (rows.length === 0) {
            return null
          }

          return {id: rows[0].id, desc: rows[0].desc}
        })
    }

    return storage.executeSQL(SQL.select.getAll)
      .then(function (rows) {
        return rows.map(function (row) { return {id: row.id, desc: row.desc} })
      })
  })
}

/**
 * @return {Promise}
 */
AbstractSQLColorDefinitionStorage.prototype.clear = function () {
  var storage = this._storage
  return storage.transaction(function () {
    return storage.executeSQL(SQL.delete.all)
  })
  .then(_.noop)
}

module.exports = AbstractSQLColorDefinitionStorage
