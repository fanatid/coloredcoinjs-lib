var assert = require('assert')
var _ = require('underscore')
var inherits = require('inherits')


/**
 * @class StoredColorData
 */
function StoredColorData() {}

StoredColorData.prototype.fetchColorvalues = function() {}


/**
 * @class ThinColorData
 */
function ThinColorData() {}

inherits(ThinColorData, StoredColorData)

ThinColorData.prototype.getColorValues = function() {}


module.exports = {
  StoredColorData: StoredColorData,
  ThinColorData: ThinColorData
}
