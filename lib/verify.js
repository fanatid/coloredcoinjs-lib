var _ = require('lodash')

var VerifyTypeError = require('./errors').VerifyTypeError


/**
 * @param {function} importFn
 * @return {function}
 */
function createInstanceCheck(importFn) {
  var cls

  function instanceCheck(thing) {
    if (_.isUndefined(cls)) { cls = importFn() }
    return thing instanceof cls
  }

  return instanceCheck
}

/**
 * @param {string} thing
 * @return {boolean}
 */
function isHexString(thing) {
  if (!(_.isString(thing) && thing.length % 2 === 0)) { return false }

  for (var i = 0; i < thing.length; ++i) {
    if ('0123456789abcdefABCDEF'.indexOf(thing[i]) === -1) { return false }
  }

  return true
}

/**
 * @param {string} thing
 * @return {boolean}
 */
function isTxId(thing) {
  return isHexString(thing) && thing.length === 64
}


var functions = {
  array: _.isArray,
  boolean: _.isBoolean,
  function: _.isFunction,
  null: _.isNull,
  number: _.isNumber,
  object: _.isObject,
  string: _.isString,

  hexString: isHexString,
  txId: isTxId,

  ColorData: createInstanceCheck(function () { return require('./ColorData') }),
  ColorDataStorage: createInstanceCheck(function () { return require('./ColorDataStorage') }),
  ColorDefinition: createInstanceCheck(function () { return require('./ColorDefinition') }),
  ColorDefinitionManager: createInstanceCheck(function () { return require('./ColorDefinitionManager') }),
  ColorDefinitionStorage: createInstanceCheck(function () { return require('./ColorDefinitionStorage') }),
  ColorSet: createInstanceCheck(function () { return require('./ColorSet') }),
  ColorTarget: createInstanceCheck(function () { return require('./ColorTarget') }),
  ColorValue: createInstanceCheck(function () { return require('./ColorValue') }),
  ComposedTx: createInstanceCheck(function () { return require('./ComposedTx') }),
  EPOBCColorDefinition: createInstanceCheck(function () { return require('./EPOBCColorDefinition') }),
  OperationalTx: createInstanceCheck(function () { return require('./OperationalTx') }),
  Transaction: createInstanceCheck(function () { return require('./bitcoin').Transaction }),
  TransactionBuilder: createInstanceCheck(function () { return require('./bitcoin').TransactionBuilder }),
  UncoloredColorDefinition: createInstanceCheck(function () { return require('./UncoloredColorDefinition') })
}

var expected = {
  array: 'array',
  boolean: 'boolean',
  function: 'function',
  null: 'null',
  number: 'number',
  object: 'Object',
  string: 'string',

  hexString: 'hex string',
  txId: 'transaction Id',

  ColorData: 'ColorData',
  ColorDataStorage: 'ColorDataStorage',
  ColorDefinition: 'ColorDefinition',
  ColorDefinitionManager: 'ColorDefinitionManager',
  ColorDefinitionStorage: 'ColorDefinitionStorage',
  ColorSet: 'ColorSet',
  ColorTarget: 'ColorTarget',
  ColorValue: 'ColorValue',
  ComposedTx: 'ComposedTx',
  EPOBCColorDefinition: 'EPOBCColorDefinition',
  OperationalTx: 'OperationalTx',
  Transaction: 'Transaction',
  TransactionBuilder: 'TransactionBuilder',
  UncoloredColorDefinition: 'UncoloredColorDefinition'
}

/**
 * @param {Object} verify
 * @param {Object} functions
 * @param {Object} expected
 */
function extendVerify(verify, functions, expected) {
  Object.keys(functions).forEach(function (name) {
    verify[name] = function () {
      var args = Array.prototype.slice.call(arguments)
      if (functions[name].apply(null, args) === false) {
        throw new VerifyTypeError('Expected ' + expected[name] + ', got ' + args)
      }
    }
  })
}

extendVerify(module.exports, functions, expected)
module.exports.createInstanceCheck = createInstanceCheck
module.exports.extendVerify = extendVerify
