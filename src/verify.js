var _ = require('lodash')


function createInstanceCheck(importFn) {
  var cls
  return function(thing) {
    if (_.isUndefined(cls)) cls = importFn()
    return thing instanceof cls
  }
}

function isHexSymbol(sym) { return '0123456789abcdef'.indexOf(sym) !== -1 }
function isHexString(thing) {
  return (
    _.isString(thing) &&
    thing.length % 2 === 0 &&
    thing.toLowerCase().split('').every(isHexSymbol)
  )
}

function isTxId(thing) {
  return isHexString(thing) && thing.length === 64
}


var functions = {
  array: _.isArray,
  boolean: _.isBoolean,
  function: _.isFunction,
  number: _.isNumber,
  object: _.isObject,
  string: _.isString,

  hexString: isHexString,
  txId: isTxId,

  ColorData: createInstanceCheck(function() { return require('./ColorData') }),
  ColorDataStorage: createInstanceCheck(function() { return require('./ColorDataStorage') }),
  ColorDefinition: createInstanceCheck(function(){ return require('./ColorDefinition') }),
  ColorDefinitionManager: createInstanceCheck(function() { return require('./ColorDefinitionManager') }),
  ColorDefinitionStorage: createInstanceCheck(function() { return require('./ColorDefinitionStorage') }),
  ColorSet: createInstanceCheck(function() { return require('./ColorSet') }),
  ColorTarget: createInstanceCheck(function() { return require('./ColorTarget') }),
  ColorValue: createInstanceCheck(function() { return require('./ColorValue') }),
  ComposedTx: createInstanceCheck(function() { return require('./ComposedTx') } ),
  EPOBCColorDefinition: createInstanceCheck(function() { return require('./EPOBCColorDefinition') }),
  OperationalTx: createInstanceCheck(function() { return require('./OperationalTx') }),
  Transaction: createInstanceCheck(function() { return require('./bitcoin').Transaction }),
  UncoloredColorDefinition: createInstanceCheck(function() { return require('./UncoloredColorDefinition') })
}

var expected = {
  array: 'array',
  boolean: 'boolean',
  function: 'function',
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
  UncoloredColorDefinition: 'UncoloredColorDefinition'
}

function extendVerify(verify, functions, expected) {
  Object.keys(functions).forEach(function(name) {
    verify[name] = function() {
      if (functions[name].call(null, arguments[0]) === false)
        throw new TypeError('Expected ' + expected[name] + ', got ' + arguments[0])
    }
  })
}

extendVerify(module.exports, functions, expected)
module.exports.createInstanceCheck = createInstanceCheck
module.exports.extendVerify = extendVerify
