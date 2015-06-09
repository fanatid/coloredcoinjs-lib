var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')

var IColorDataStorage = require('./interface')
var errors = require('../../errors')

var SQL = {}

SQL['SQLite'] = {
  create: {
    tables: {
      tx: 'CREATE TABLE IF NOT EXISTS color_data_tx ( ' +
          '  pk INTEGER PRIMARY KEY AUTOINCREMENT, ' +
          '  color_code TEXT NOT NULL, ' +
          '  txid TEXT NOT NULL)',
      values: 'CREATE TABLE IF NOT EXISTS color_data_values ( ' +
              '  oidx INTEGER NOT NULL, ' +
              '  color_id INTEGER NOT NULL, ' +
              '  value TEXT NOT NULL, ' +
              '  tx_pk INTEGER NOT NULL, ' +
              '  FOREIGN KEY (tx_pk) REFERENCES color_data_tx(pk))'
    },
    indices: {
      tx: 'CREATE INDEX IF NOT EXISTS color_data_tx_idx ' +
          '  ON color_data_tx (txid, color_code)'
    }
  },
  insert: {
    tx: 'INSERT INTO color_data_tx (color_code, txid) VALUES ($1, $2)',
    value: 'INSERT INTO color_data_values (oidx, color_id, value, tx_pk) ' +
           '  VALUES ($1, $2, $3, $4)'
  },
  select: {
    pk: 'SELECT pk FROM color_data_tx WHERE color_code = $1 AND txid = $2',
    value: 'SELECT color_data_values.value FROM color_data_tx ' +
           '  JOIN color_data_values ' +
           '    ON color_data_values.tx_pk = color_data_tx.pk ' +
           '  WHERE ' +
           '    color_data_tx.color_code = $1 AND ' +
           '    color_data_tx.txid = $2 AND ' +
           '    color_data_values.oidx = $3 AND ' +
           '    color_data_values.color_id = $4',
    all: 'SELECT * FROM color_data_tx ' +
         '  JOIN color_data_values ' +
         '    ON color_data_values.tx_pk = color_data_tx.pk ' +
         '  WHERE ' +
         '    color_data_tx.color_code = $1 AND ' +
         '    color_data_tx.txid = $2',
    oidxFilter: 'SELECT * FROM color_data_tx ' +
                '  JOIN color_data_values ' +
                '    ON color_data_values.tx_pk = color_data_tx.pk ' +
                '  WHERE ' +
                '    color_data_tx.color_code = $1 AND ' +
                '    color_data_tx.txid = $2 AND ' +
                '    color_data_values.oidx = $3'
  },
  delete: {
    tx: 'DELETE FROM color_data_tx WHERE pk = $1',
    values: 'DELETE FROM color_data_values WHERE tx_pk = $1',
    all: {
      tx: 'DELETE FROM color_data_tx',
      values: 'DELETE FROM color_data_values'
    }
  }
}

SQL['PostgreSQL'] = _.cloneDeep(SQL['SQLite'])
SQL['PostgreSQL'].create.tables.tx = [
  'CREATE TABLE IF NOT EXISTS color_data_tx ( ',
  '  pk SERIAL PRIMARY KEY, ',
  '  color_code TEXT NOT NULL, ',
  '  txid TEXT NOT NULL)'
].join('')

SQL['PostgreSQL'].create.indices.tx = [
  'DO $$',
  'BEGIN',
  '  IF NOT EXISTS (',
  '    SELECT 1',
  '      FROM pg_class c',
  '      JOIN pg_namespace n',
  '      ON n.oid = c.relnamespace',
  '      WHERE c.relname = \'color_data_tx_idx\'',
  '      AND n.nspname = \'public\'',
  '  ) THEN',
  '  CREATE INDEX color_data_tx_idx ON color_data_tx (txid, color_code);',
  'END IF;',
  'END$$;'
].join('')

/**
 * @class AbstractSyncColorDataStorage
 * @extends IColorDataStorage
 *
 * @param {IStorageProvider} storageProvider
 */
function AbstractSyncColorDataStorage (storageProvider) {
  var self = this
  IColorDataStorage.call(self)

  self._storage = storageProvider
  self._SQL = SQL[self._storage.getDBName()]

  self._storage.open()
    .then(function () {
      return self._storage.transaction(function () {
        return Promise.all([
          self._storage.executeSQL(self._SQL.create.tables.tx),
          self._storage.executeSQL(self._SQL.create.tables.values)
        ])
        .then(function () {
          return self._storage.executeSQL(self._SQL.create.indices.tx)
        })
      })
    })
    .done(function () { self._ready() },
          function (err) { self._ready(err) })
}

inherits(AbstractSyncColorDataStorage, IColorDataStorage)
_.extend(AbstractSyncColorDataStorage, IColorDataStorage)

/**
 * @param {IDataStorage~Record} data
 * @return {Promise.<IDataStorage~Record>}
 */
AbstractSyncColorDataStorage.prototype.add = function (data) {
  var self = this
  return self._storage.transaction(function () {
    // are we have another value for colorCode, txid, oidx, colorId ?
    var args = [data.colorCode, data.txid, data.oidx, data.colorId]
    return self._storage.executeSQL(self._SQL.select.value, args)
      .then(function (rows) {
        var value = JSON.stringify(data.value)
        if (rows.length > 0 && rows[0].value !== value) {
          throw new errors.Storage.ColorData.HaveAnotherValue(
            data.txid, data.oidx, data.colorId, data.colorCode, rows[0].value)
        }

        /**
         * @return {?number}
         */
        function getPK () {
          var args = [data.colorCode, data.txid]
          return self._storage.executeSQL(self._SQL.select.pk, args)
            .then(function (rows) {
              return rows.length === 0 ? null : rows[0].pk
            })
        }

        // save
        return getPK()
          .then(function (pk) {
            if (pk !== null) {
              return pk
            }

            var args = [data.colorCode, data.txid]
            return self._storage.executeSQL(self._SQL.insert.tx, args)
              .then(getPK)
          })
          .then(function (pk) {
            var args = [data.oidx, data.colorId, data.value, pk]
            return self._storage.executeSQL(self._SQL.insert.value, args)
          })
      })
  })
  .then(function () {
    // return new record
    return {
      colorCode: data.colorCode,
      txid: data.txid,
      oidx: data.oidx,
      colorId: data.colorId,
      value: data.value
    }
  })
}

/**
 * @param {Object} opts
 * @param {string} opts.colorCode
 * @param {string} opts.txid
 * @param {number} [opts.oidx]
 * @return {Promise.<Object>}
 */
AbstractSyncColorDataStorage.prototype.get = function (opts) {
  var self = this
  return self._storage.transaction(function () {
    var sql = self._SQL.select.all
    var args = [opts.colorCode, opts.txid]

    if (opts.oidx !== undefined) {
      sql = self._SQL.select.oidxFilter
      args = [opts.colorCode, opts.txid, opts.oidx]
    }

    return self._storage.executeSQL(sql, args)
  })
  .then(function (rows) {
    return rows.reduce(function (obj, row) {
      var ovalues = obj[row.oidx] || {}
      ovalues[row.color_id] = JSON.parse(row.value)
      obj[row.oidx] = ovalues
      return obj
    }, {})
  })
}

/**
 * @param {Object} opts
 * @param {string} opts.colorCode
 * @param {string} opts.txid
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.remove = function (opts) {
  var self = this
  return self._storage.transaction(function (tx) {
    var args = [opts.colorCode, opts.txid]
    return self._storage.executeSQL(self._SQL.select.pk, args)
      .then(function (rows) {
        if (rows.length !== 1) {
          return
        }

        return self._storage.executeSQL(self._SQL.delete.values, [rows[0].pk])
          .then(function () {
            return self._storage.executeSQL(self._SQL.delete.tx, [rows[0].pk])
          })
      })
  })
  .then(function () {})
}

/**
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.clear = function () {
  var self = this
  return self._storage.transaction(function () {
    return self._storage.executeSQL(self._SQL.delete.all.values)
      .then(function () {
        return self._storage.executeSQL(self._SQL.delete.all.tx)
      })
  })
  .then(function () {})
}

module.exports = AbstractSyncColorDataStorage
