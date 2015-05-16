/* globals Promise:true */
var Promise = require('bluebird')

/**
 * @class SQLiteProvider
 */
function SQLiteProvider () {}

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
