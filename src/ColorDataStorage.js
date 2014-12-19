var inherits = require('util').inherits

var _ = require('lodash')

var SyncStorage = require('./SyncStorage')
var errors = require('./errors')
var util = require('./util')
var verify = require('./verify')


/**
 * @typedef {Object} ColorDataStorage~Record
 * @property {number} colorId
 * @property {string} txId
 * @property {number} outIndex
 * @property {number} value
 */

/**
 * @class ColorDataStorage
 * @extends SyncStorage
 *
 * @param {Object} [opts]
 * @param {number} [opts.saveTimeout=1000] In milliseconds
 */
function ColorDataStorage(opts) {
  opts = _.extend({
    saveTimeout: 1000
  }, opts)
  verify.number(opts.saveTimeout)

  SyncStorage.apply(this, Array.prototype.slice.call(arguments))

  this._save2store = util.debounce(this._save2store, opts.saveTimeout, this)

  this.colorTxsDBKey = this.globalPrefix + 'colorTxs'
  this.colorTxRecords = this.store.get(this.colorTxsDBKey) || []

  if (_.isUndefined(this.store.get(this.colorTxsDBKey + '_version'))) {
    this.store.set(this.colorTxsDBKey + '_version', '1')
  }

  if (this.store.get(this.colorTxsDBKey + '_version') === '1') {
    this.store.set(this.colorTxsDBKey + '_version', 2)
  }
}

inherits(ColorDataStorage, SyncStorage)

/**
 * @private
 * @return {ColorDataStorage~Record[]}
 */
ColorDataStorage.prototype._getRecords = function () {
  return this.colorTxRecords
}

/**
 * @private
 * @param {ColorDataStorage~Record[]} records
 */
ColorDataStorage.prototype._saveRecords = function (records) {
  this.colorTxRecords = records
  this._save2store()
}

/**
 * @private
 */
ColorDataStorage.prototype._save2store = function () {
  this.store.set(this.colorTxsDBKey, this.colorTxRecords)
}

/**
 * @param {Object} data
 * @param {number} data.colorId
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @param {number} data.value
 * @return {ColorDataStorage~Record}
 * @throws {UniqueConstraintError} If same colorId, txId, outIndex exists and values not equal
 */
ColorDataStorage.prototype.add = function (data) {
  verify.object(data)
  verify.number(data.colorId)
  verify.txId(data.txId)
  verify.number(data.outIndex)
  verify.number(data.value)

  var record = _.find(this._getRecords(), {
    colorId: data.colorId,
    txId: data.txId,
    outIndex: data.outIndex
  })

  if (_.isUndefined(record)) {
    var records = this._getRecords()
    records.push({
      colorId: data.colorId,
      txId: data.txId,
      outIndex: data.outIndex,
      value: data.value
    })
    this._saveRecords(records)
    record = _.last(records)
  }

  if (record.value !== data.value) {
    throw new errors.UniqueConstraintError(
      'Record: ' + JSON.stringify(record) + ', recived data: ' + JSON.strinigfy(data))
  }

  return _.clone(record)
}

/**
 * @param {Object} data
 * @param {number} data.colorId
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @return {?number}
 */
ColorDataStorage.prototype.getValue = function (data) {
  verify.object(data)
  verify.number(data.colorId)
  verify.txId(data.txId)
  verify.number(data.outIndex)

  var record = _.find(this._getRecords(), {
    colorId: data.colorId,
    txId: data.txId,
    outIndex: data.outIndex
  })
  return _.isUndefined(record) ? null : record.value
}

/**
 * @param {Object} data
 * @param {string} data.txId
 * @param {number} data.outIndex
 * @return {?ColorDataStorage~Record}
 */
ColorDataStorage.prototype.getAnyValue = function (data) {
  verify.object(data)
  verify.txId(data.txId)
  verify.number(data.outIndex)

  var record = _.find(this._getRecords(), {
    txId: data.txId,
    outIndex: data.outIndex
  })
  return _.isUndefined(record) ? null : record
}

/**
 * @param {Object} data
 * @param {number} [data.colorId]
 * @param {string} [data.txId]
 * @param {number} [data.outIndex]
 */
ColorDataStorage.prototype.remove = function (data) {
  verify.object(data)
  if (_.isUndefined(data.colorId) && _.isUndefined(data.txId) && _.isUndefined(data.outIndex)) {
    return
  }

  if (!_.isUndefined(data.colorId)) { verify.number(data.colorId) }
  if (!_.isUndefined(data.txId)) { verify.txId(data.txId) }
  if (!_.isUndefined(data.outIndex)) { verify.number(data.outIndex) }

  var records = this._getRecords().filter(function (record) {
    if (!_.isUndefined(data.colorId) && record.colorId !== data.colorId) { return true }
    if (!_.isUndefined(data.txId) && record.txId !== data.txId) { return true }
    if (!_.isUndefined(data.outIndex) && record.outIndex !== data.outIndex) { return true }
    return false
  })
  this._saveRecords(records)
}

/**
 * Remove all color data from store
 */
ColorDataStorage.prototype.clear = function () {
  this.store.remove(this.colorTxsDBKey)
  this.store.remove(this.colorTxsDBKey + '_version')
}


module.exports = ColorDataStorage
