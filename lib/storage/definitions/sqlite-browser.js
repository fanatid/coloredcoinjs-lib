var inherits = require('util').inherits

var SQLiteProvider = require('../providers/sqlite')
var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class ColorDefinitionSQLiteStorage
 * @extends AbstractSQLColorDefinitionStorage
 */
function ColorDefinitionSQLiteStorage () {
  var provider = new SQLiteProvider()
  AbstractSQLColorDefinitionStorage.call(this, provider)
}

inherits(ColorDefinitionSQLiteStorage, AbstractSQLColorDefinitionStorage)

ColorDefinitionSQLiteStorage.isAvailable = SQLiteProvider.isAvailable

module.exports = ColorDefinitionSQLiteStorage
