'use strict'

module.exports.getArrayOfNull = function (n) {
  var result = new Array(n)
  for (var i = 0; i < n; ++i) {
    result[i] = null
  }
  return result
}
