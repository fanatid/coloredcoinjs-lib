/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)
var timers = require('timers')

var AbstractColorDefinitionStorage = require('./abstract')

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
  drop: 'DROP TABLE definitions'
}

/**
 * @class AbstractSQLColorDefinitionStorage
 * @extends AbstractColorDefinitionStorage
 *
 * @param {Object} storage
 */
function AbstractSQLColorDefinitionStorage (storage) {
  var self = this
  if (!(self instanceof AbstractSQLColorDefinitionStorage)) {
    return new AbstractSQLColorDefinitionStorage()
  }

  self._storage = storage
  AbstractColorDefinitionStorage.call(self)

  timers.setImmediate(function () {
    self._storage.open()
      .then(function () {
        return self._storage.transaction(function (tx) {
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
 * @return {Promise.<?AbstractColorDefinitionStorage~Record>}
 */
AbstractSQLColorDefinitionStorage.prototype.resolve =
function (desc, autoAdd) {
  var self = this
  return self._storage.transaction(function (tx) {
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
 *   ?AbstractColorDefinitionStorage~Record|
 *   AbstractColorDefinitionStorage~Record[]
 * )>}
 */
AbstractSQLColorDefinitionStorage.prototype.get = function (id) {
  var self = this
  return self._storage.transaction(function (tx) {
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
  return this._storage.transaction(function (tx) {
    return tx.execute(SQL.drop)
      .then(function () {
        return tx.execute(SQL.create)
      })
  })
  .then(function () {})
}

module.exports = AbstractSQLColorDefinitionStorage
