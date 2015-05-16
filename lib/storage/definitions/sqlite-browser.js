var inherits = require('util').inherits

var SQLiteProvider = require('../providers/sqlite')
var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class ColorDefinitionSQLiteStorage
 * @extends AbstractSQLColorDefinitionStorage
 */
function ColorDefinitionSQLiteStorage () {
  var storage = new SQLiteProvider()
  AbstractSQLColorDefinitionStorage.call(this, storage)
}

inherits(ColorDefinitionSQLiteStorage, AbstractSQLColorDefinitionStorage)

ColorDefinitionSQLiteStorage.isAvailable = SQLiteProvider.isAvailable

module.exports = ColorDefinitionSQLiteStorage
