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
 *
 * @param {Object} provider
 */
function AbstractSQLColorDefinitionStorage (provider) {
  var self = this
  IColorDefinitionStorage.call(self)

  self._provider = provider
  self._provider.open()
    .then(function () {
      return self._provider.transaction(function (tx) {
        return tx.execute(SQL.create)
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
  var self = this
  return self._provider.transaction(function (tx) {
    return tx.execute(SQL.select.resolve, [desc])
      .then(function (rows) {
        if (rows.length !== 0) {
          return {record: {id: rows[0].id, desc: desc}, new: false}
        }

        var autoAdd = Object(opts).autoAdd
        if (!autoAdd && autoAdd !== undefined) {
          return {record: null, new: null}
        }

        return tx.execute(SQL.insert, [desc])
          .then(function () {
            return tx.execute(SQL.select.last)
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
  var self = this
  return self._provider.transaction(function (tx) {
    var id = Object(opts).id
    if (id !== undefined) {
      return tx.execute(SQL.select.getById, [id])
        .then(function (rows) {
          if (rows.length === 0) {
            return null
          }

          return {id: rows[0].id, desc: rows[0].desc}
        })
    }

    return tx.execute(SQL.select.getAll)
      .then(function (rows) {
        return rows.map(function (row) { return {id: row.id, desc: row.desc} })
      })
  })
}

/**
 * @return {Promise}
 */
AbstractSQLColorDefinitionStorage.prototype.clear = function () {
  return this._provider.transaction(function (tx) {
    return tx.execute(SQL.delete.all)
  })
  .then(function () {})
}

module.exports = AbstractSQLColorDefinitionStorage
