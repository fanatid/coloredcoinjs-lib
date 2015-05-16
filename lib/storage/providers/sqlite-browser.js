/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)

/**
 * @class SQLiteProvider
 */
function SQLiteProvider () {}

readyMixin(SQLiteProvider.prototype)

/**
 * @return {boolean}
 */
SQLiteProvider.isAvailable = function () { return false }

/**
 * @return {Promise}
 */
SQLiteProvider.prototype.open = function () {
  return new Promise(function () {})
}

module.exports = SQLiteProvider
