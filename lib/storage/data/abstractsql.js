var _ = require('lodash')
var inherits = require('util').inherits

var IColorDataStorage = require('./interface')

var SQL = {
  create: {
    table: 'CREATE TABLE IF NOT EXISTS data ( ' +
           '  txid CHAR(64) NOT NULL, ' +
           '  vout INTEGER NOT NULL, ' +
           '  colorId INTEGER NOT NULL, ' +
           '  value INTEGER NOT NULL)',
    indexOutput: 'CREATE INDEX IF NOT EXISTS data_idx ON data (txid, vout)'
  },
  insert: {
    row: 'INSERT INTO data (txid, vout, colorId, value) VALUES ($1, $2, $3, $4)'
  },
  select: {
    all: 'SELECT vout, colorId, value FROM data WHERE txid = $1',
    by: {
      vout: 'SELECT colorId, value FROM data WHERE txid = $1 AND vout = $2',
      colorId: 'SELECT vout, value FROM data WHERE txid = $1 AND colorId = $2',
      both: 'SELECT value FROM data WHERE txid = $1 AND vout = $2 AND colorId = $3'
    }
  },
  delete: {
    tx: 'DELETE FROM data WHERE txid = $1',
    all: 'DELETE FROM data'
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
        return tx.execute(SQL.create.table)
          .then(function () { return tx.execute(SQL.create.indexOutput) })
      })
    })
    .done(function () { self._ready() },
          function (err) { self._ready(err) })
}

inherits(AbstractSyncColorDataStorage, IColorDataStorage)

/**
 * @return {boolean}
 */
AbstractSyncColorDataStorage.isAvailable = function () { return false }

/**
 * @param {IDataStorage~Record} data
 * @return {Promise.<IDataStorage~Record>}
 */
AbstractSyncColorDataStorage.prototype.add = function (data) {
  return this._provider.transaction(function (tx) {
    // output for color id already exists?
    return tx.execute(SQL.select.by.both, [data.txid, data.vout, data.colorId])
      .then(function (rows) {
        if (rows.length > 0) {
          var msg = 'Value for output ' + data.txid + ':' + data.vout +
            ' with colorId ' + data.colorId + ' already exists.'
          throw new Error(msg)
        }

        // save
        return tx.execute(SQL.insert.row, [data.txid, data.vout, data.colorId, data.value])
      })
  })
  .then(function () {
    // return new record
    return {
      txid: data.txid,
      vout: data.vout,
      colorId: data.colorId,
      value: data.value
    }
  })
}

/**
 * @param {Object} opts
 * @param {string} opts.txid
 * @param {number} [opts.vout]
 * @param {number} [opts.colorId]
 * @return {Promise.<(Object|?number)>}
 */
AbstractSyncColorDataStorage.prototype.get = function (opts) {
  return this._provider.transaction(function (tx) {
    if (opts.vout !== undefined && opts.colorId !== undefined) {
      return tx.execute(SQL.select.by.both, [opts.txid, opts.vout, opts.colorId])
        .then(function (rows) {
          return rows.length === 0 ? null : rows[0].value
        })
    }

    if (opts.vout !== undefined) {
      return tx.execute(SQL.select.by.vout, [opts.txid, opts.vout])
        .then(function (rows) {
          return _.zipObject(rows.map(function (row) {
            return [row.colorId, row.value]
          }))
        })
    }

    if (opts.colorId !== undefined) {
      return tx.execute(SQL.select.by.colorId, [opts.txid, opts.colorId])
        .then(function (rows) {
          return _.zipObject(rows.map(function (row) {
            return [row.vout, row.value]
          }))
        })
    }

    return tx.execute(SQL.select.all, [opts.txid])
      .then(function (rows) {
        var result = {}
        rows.forEach(function (row) {
          var ovalues = result[row.vout] || {}
          ovalues[row.colorId] = row.value
          result[row.vout] = ovalues
        })
        return result
      })
  })
}

/**
 * @param {string} txid
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.remove = function (txid) {
  return this._provider.transaction(function (tx) {
    return tx.execute(SQL.delete.tx, [txid])
  })
  .then(function () {})
}

/**
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.clear = function () {
  return this._provider.transaction(function (tx) {
    return tx.execute(SQL.delete.all)
  })
  .then(function () {})
}

module.exports = AbstractSyncColorDataStorage
