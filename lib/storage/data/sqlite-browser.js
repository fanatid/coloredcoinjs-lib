var inherits = require('util').inherits

var SQLiteProvider = require('../providers/sqlite')
var AbstractSQLColorDataStorage = require('./abstractsql')

/**
 * @class StubColorDataSQLiteStorage
 * @extends AbstractSQLColorDataStorage
 */
function StubColorDataSQLiteStorage () {
  var provider = new SQLiteProvider()
  AbstractSQLColorDataStorage.call(this, provider)
}

inherits(StubColorDataSQLiteStorage, AbstractSQLColorDataStorage)

StubColorDataSQLiteStorage.isAvailable = SQLiteProvider.isAvailable

module.exports = StubColorDataSQLiteStorage
