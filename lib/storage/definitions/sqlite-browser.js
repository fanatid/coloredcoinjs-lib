var inherits = require('util').inherits

var SQLiteProvider = require('../providers/sqlite')
var AbstractSQLColorDefinitionStorage = require('./abstractsql')

/**
 * @class ColorDefinitionSQLiteStorage
 * @extends AbstractSQLColorDefinitionStorage
 */
function ColorDefinitionSQLiteStorage () {
  if (!(this instanceof ColorDefinitionSQLiteStorage)) {
    return new ColorDefinitionSQLiteStorage()
  }

  var storage = new SQLiteProvider()
  AbstractSQLColorDefinitionStorage.call(this, storage)
}

inherits(ColorDefinitionSQLiteStorage, AbstractSQLColorDefinitionStorage)

/**
 * @return {boolean}
 */
ColorDefinitionSQLiteStorage.isAvailable = function () { return false }

module.exports = ColorDefinitionSQLiteStorage
