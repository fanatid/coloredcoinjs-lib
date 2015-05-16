/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)
var timers = require('timers')

var IColorDefinitionStorage = require('./interface')

var SQL = {
  create: 'CREATE TABLE IF NOT EXISTS definitions ( ' +
          '  id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
          '  desc TEXT NOT NULL UNIQUE)',
  insert: 'INSERT INTO definitions (desc) VALUES ($1)',
  select: {
    resolve: 'SELECT desc, id FROM definitions WHERE desc = $1',
    last: 'SELECT desc, id FROM definitions ORDER BY id DESC LIMIT 1',
    getById: 'SELECT desc, id FROM definitions WHERE id = $1',
    getAll: 'SELECT desc, id FROM definitions'
  },
  delete: {
    all: 'DELETE FROM definitions'
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

  self._provider = provider
  IColorDefinitionStorage.call(self)

  timers.setImmediate(function () {
    self._provider.open()
      .then(function () {
        return self._provider.transaction(function (tx) {
          return tx.execute(SQL.create)
        })
      })
      .then(function () { self._ready() },
            function (err) { self._ready(err) })
  })
}

readyMixin(AbstractSQLColorDefinitionStorage.prototype)

/**
 * @return {boolean}
 */
AbstractSQLColorDefinitionStorage.isAvailable = function () { return false }

/**
 * @param {string} desc
 * @param {boolean} [autoAdd=true]
 * @return {Promise.<?IColorDefinitionStorage~Record>}
 */
AbstractSQLColorDefinitionStorage.prototype.resolve =
function (desc, autoAdd) {
  var self = this
  return self._provider.transaction(function (tx) {
    return tx.execute(SQL.select.resolve, [desc])
      .then(function (rows) {
        if (rows.length !== 0) {
          return {id: rows[0].id, desc: desc}
        }

        if (!autoAdd && autoAdd !== undefined) {
          return null
        }

        return tx.execute(SQL.insert, [desc])
          .then(function () {
            return tx.execute(SQL.select.last)
          })
          .then(function (rows) {
            return {id: rows[0].id, desc: desc}
          })
      })
  })
}

/**
 * @param {number} [id]
 * @return {Promise.<(
 *   ?IColorDefinitionStorage~Record|
 *   IColorDefinitionStorage~Record[]
 * )>}
 */
AbstractSQLColorDefinitionStorage.prototype.get = function (id) {
  var self = this
  return self._provider.transaction(function (tx) {
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

/**
 * @return {string}
 */
AbstractSQLColorDefinitionStorage.prototype.inspect = function () {
  return '<storage.definitions.AbstractSQLColorDefinitionStorage>'
}

module.exports = AbstractSQLColorDefinitionStorage
