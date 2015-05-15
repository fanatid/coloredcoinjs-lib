var _ = require('lodash')

var bitcoin = require('./bitcoin')
var errors = require('./errors')

/**
 * @param {number} n
 * @param {number} [bits=32]
 * @return {number[]}
 */
function number2bitArray (n, bits) {
  if (_.isUndefined(bits)) { bits = 32 }

  return _.range(bits).map(function (shift) { return (n >> shift) & 1 })
}

/**
 * @param {number[]} bits
 * @return {number}
 */
function bitArray2number (bits) {
  return bits.reduce(function (result, value, index) {
    return value === 0 ? result : result + Math.pow(2, index)
  }, 0)
}

/**
 * @typedef {Object} groupTargetsByColorResult
 * @property {ColorTarget[]} colorId1
 * @property {ColorTarget[]} colorIdN
 */

/**
 * Group targets by ColorId or return error if target is not uncolored
 *  or not instance of targetCls
 *
 * @param {ColorTarget[]} targets
 * @param {function} targetCls ColorDefinition constructor for filter targets
 * @return {groupTargetsByColorResult}
 * @throws {IncompatibilityColorDefinitionsError} If ColorDefinition not Uncolored and not targetCls
 */
function groupTargetsByColor (targets, targetCls) {
  var targetsByColor = {}
  targets.forEach(function (target) {
    var colorDefinition = target.getColorDefinition()

    var UncoloredColorDefinition = require('./UncoloredColorDefinition')
    var isUncoloredCls = colorDefinition instanceof UncoloredColorDefinition
    var isTargetCls = colorDefinition instanceof targetCls

    if (!isUncoloredCls && !isTargetCls) {
      throw new errors.IncompatibilityColorDefinitionsError()
    }

    var colorId = target.getColorId()

    if (_.isUndefined(targetsByColor[colorId])) {
      targetsByColor[colorId] = []
    }
    targetsByColor[colorId].push(target)
  })

  return targetsByColor
}

/**
 * @param {string} address
 * @return {external:bitcoinjs-lib.Script}
 */
function address2script (address) {
  return bitcoin.Address.fromBase58Check(address).toOutputScript()
}

module.exports = {
  number2bitArray: number2bitArray,
  bitArray2number: bitArray2number,

  groupTargetsByColor: groupTargetsByColor,

  address2script: address2script
}
