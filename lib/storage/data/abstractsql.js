var _ = require('lodash')
var inherits = require('util').inherits

var IColorDataStorage = require('./interface')

var SQL = {
  create: {
    table: 'CREATE TABLE IF NOT EXISTS data ( ' +
           '  txid CHAR(64) NOT NULL, ' +
           '  vout INTEGER NOT NULL, ' +
           '  colorid INTEGER NOT NULL, ' +
           '  value INTEGER NOT NULL)',
    indexOutput: 'CREATE INDEX IF NOT EXISTS data_idx ON data (txid, vout)'
  },
  insert: {
    row: 'INSERT INTO data (txid, vout, colorid, value) VALUES ($1, $2, $3, $4)'
  },
  select: {
    values: 'SELECT colorid, value FROM data WHERE txid = $1 and vout = $2',
    value: 'SELECT value FROM data WHERE txid = $1 and vout = $2 and colorid = $3',
    count: 'SELECT COUNT(*) as cnt FROM data WHERE txid = $1 and vout = $2'
  },
  delete: {
    output: 'DELETE FROM data WHERE txid = $1 and vout = $2',
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
AbstractSyncColorDataStorage.prototype.addColorValue = function (data) {
  return this._provider.transaction(function (tx) {
    // output for color id already exists?
    return tx.execute(SQL.select.value, [data.txid, data.vout, data.colorId])
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
 * @param {string} txid
 * @param {number} vout
 * @param {number} [colorId]
 * @return {Promise.<(Object|?number)>}
 */
AbstractSyncColorDataStorage.prototype.getColorValues = function (txid, vout, colorId) {
  return this._provider.transaction(function (tx) {
    if (colorId === undefined) {
      return tx.execute(SQL.select.values, [txid, vout])
        .then(function (rows) {
          return _.zipObject(rows.map(function (row) {
            return [row.colorid, row.value]
          }))
        })
    }

    return tx.execute(SQL.select.value, [txid, vout, colorId])
      .then(function (rows) {
        return rows.length === 0 ? null : rows[0].value
      })
  })
}

/**
 * @param {string} txid
 * @param {number} vout
 * @return {Promise.<boolean>}
 */
AbstractSyncColorDataStorage.prototype.isColoredOutput = function (txid, vout) {
  return this._provider.transaction(function (tx) {
    return tx.execute(SQL.select.count, [txid, vout])
  })
  .then(function (rows) { return rows[0].cnt > 0 })
}

/**
 * @param {string} txid
 * @param {number} vout
 * @return {Promise}
 */
AbstractSyncColorDataStorage.prototype.removeOutput = function (txid, vout) {
  return this._provider.transaction(function (tx) {
    return tx.execute(SQL.delete.output, [txid, vout])
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
