var inherits = require('util').inherits
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

inherits(AbstractSQLColorDefinitionStorage, IColorDefinitionStorage)

/**
 * @return {boolean}
 */
AbstractSQLColorDefinitionStorage.isAvailable = function () { return false }

/**
 * @param {string} desc
 * @param {Object} [opts]
 * @param {boolean} [opts.autoAdd=true]
 * @return {Promise.<?IColorDefinitionStorage~Record>}
 */
AbstractSQLColorDefinitionStorage.prototype.resolve =
function (desc, opts) {
  var self = this
  return self._provider.transaction(function (tx) {
    return tx.execute(SQL.select.resolve, [desc])
      .then(function (rows) {
        if (rows.length !== 0) {
          return {id: rows[0].id, desc: desc}
        }

        var autoAdd = Object(opts).autoAdd
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
