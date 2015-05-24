var inherits = require('util').inherits

var SQLiteProvider = require('../providers/sqlite')
var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class StubColorDefinitionSQLiteStorage
 * @extends AbstractSQLColorDefinitionStorage
 */
function StubColorDefinitionSQLiteStorage () {
  var provider = new SQLiteProvider()
  AbstractSQLColorDefinitionStorage.call(this, provider)
}

inherits(StubColorDefinitionSQLiteStorage, AbstractSQLColorDefinitionStorage)

StubColorDefinitionSQLiteStorage.isAvailable = SQLiteProvider.isAvailable

module.exports = StubColorDefinitionSQLiteStorage
