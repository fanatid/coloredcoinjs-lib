var _ = require('lodash')
var inherits = require('util').inherits

var IColorDataStorage = require('./interface')
var errors = require('../../errors')

var SQL = {
  create: {
    tables: {
      tx: 'CREATE TABLE IF NOT EXISTS color_data_tx ( ' +
          '  pk INTEGER PRIMARY KEY AUTOINCREMENT, ' +
          '  color_code TEXT NOT NULL, ' +
          '  txid CHAR(64) NOT NULL)',
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

/**
 * @class AbstractSyncColorDataStorage
 * @extends IColorDataStorage
 *
 * @param {Object} provider
 */
function AbstractSyncColorDataStorage (provider) {
  var self = this
  IColorDataStorage.call(self)

  self._provider = provider
  self._provider.open()
    .then(function () {
      return self._provider.transaction(function (tx) {
        return Promise.all([
          tx.execute(SQL.create.tables.tx),
          tx.execute(SQL.create.tables.values)
        ])
        .then(function () { return tx.execute(SQL.create.indices.tx) })
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
  return this._provider.transaction(function (tx) {
    // are we have another value for colorCode, txid, oidx, colorId ?
    var args = [data.colorCode, data.txid, data.oidx, data.colorId]
    return tx.execute(SQL.select.value, args)
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
          return tx.execute(SQL.select.pk, [data.colorCode, data.txid])
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

            return tx.execute(SQL.insert.tx, [data.colorCode, data.txid])
              .then(getPK)
          })
          .then(function (pk) {
            return tx.execute(SQL.insert.value, [
              data.oidx, data.colorId, data.value, pk])
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
  return this._provider.transaction(function (tx) {
    var sql = SQL.select.all
    var args = [opts.colorCode, opts.txid]

    if (opts.oidx !== undefined) {
      sql = SQL.select.oidxFilter
      args = [opts.colorCode, opts.txid, opts.oidx]
    }

    return tx.execute(sql, args)
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
  return this._provider.transaction(function (tx) {
    return tx.execute(SQL.select.pk, [opts.colorCode, opts.txid])
      .then(function (rows) {
        if (rows.length === 1) {
          return Promise.all([
            tx.execute(SQL.delete.tx, [rows[0].pk]),
            tx.execute(SQL.delete.values, [rows[0].pk])
          ])
        }
      })
  })
  .then(function () {})
}

/**
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.clear = function () {
  return this._provider.transaction(function (tx) {
    return Promise.all([
      tx.execute(SQL.delete.all.tx),
      tx.execute(SQL.delete.all.values)
    ])
  })
  .then(function () {})
}

module.exports = AbstractSyncColorDataStorage
