var _ = require('lodash')
var inherits = require('util').inherits

var IColorDefinitionStorage = require('./interface')

var SQL = {}

SQL['SQLite'] = {
  create: 'CREATE TABLE IF NOT EXISTS cclib_definitions ( ' +
          '  id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
          '  cdesc TEXT NOT NULL UNIQUE)',
  insert: 'INSERT INTO cclib_definitions (cdesc) VALUES ($1)',
  select: {
    resolve: 'SELECT cdesc, id FROM cclib_definitions WHERE cdesc = $1',
    last: 'SELECT cdesc, id FROM cclib_definitions ORDER BY id DESC LIMIT 1',
    getById: 'SELECT cdesc, id FROM cclib_definitions WHERE id = $1',
    getAll: 'SELECT cdesc, id FROM cclib_definitions'
  },
  delete: {
    all: 'DELETE FROM cclib_definitions'
  }
}

SQL['PostgreSQL'] = _.cloneDeep(SQL['SQLite'])
SQL['PostgreSQL'].create = [
  'CREATE TABLE IF NOT EXISTS cclib_definitions ( ',
  '  id SERIAL PRIMARY KEY, ',
  '  cdesc TEXT NOT NULL UNIQUE)'
].join('')

/**
 * @class AbstractSQLColorDefinitionStorage
 * @extends IColorDefinitionStorage
 */
function AbstractSQLColorDefinitionStorage () {
  var self = this
  IColorDefinitionStorage.call(self)

  self._SQL = SQL[self._engineName]

  self._storage.open()
    .then(function () {
      return self._storage.transaction(function () {
        return self._storage.executeSQL(self._SQL.create)
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
  return self._storage.transaction(function () {
    return self._storage.executeSQL(self._SQL.select.resolve, [desc])
      .then(function (rows) {
        if (rows.length !== 0) {
          return {record: {id: rows[0].id, desc: desc}, new: false}
        }

        var autoAdd = Object(opts).autoAdd
        if (!autoAdd && autoAdd !== undefined) {
          return {record: null, new: null}
        }

        return self._storage.executeSQL(self._SQL.insert, [desc])
          .then(function () {
            return self._storage.executeSQL(self._SQL.select.last)
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
  return self._storage.transaction(function () {
    var id = Object(opts).id
    if (id !== undefined) {
      return self._storage.executeSQL(self._SQL.select.getById, [id])
        .then(function (rows) {
          if (rows.length === 0) {
            return null
          }

          return {id: rows[0].id, desc: rows[0].cdesc}
        })
    }

    return self._storage.executeSQL(self._SQL.select.getAll)
      .then(function (rows) {
        return rows.map(function (row) { return {id: row.id, desc: row.cdesc} })
      })
  })
}

/**
 * @return {Promise}
 */
AbstractSQLColorDefinitionStorage.prototype.clear = function () {
  var self = this
  return self._storage.transaction(function () {
    return self._storage.executeSQL(self._SQL.delete.all)
  })
  .then(_.noop)
}

module.exports = AbstractSQLColorDefinitionStorage
