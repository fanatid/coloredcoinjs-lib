var _ = require('lodash')
var Q = require('q')

var bitcoin = require('./bitcoin')
var errors = require('./errors')
var verify = require('./verify')


/**
 * @param {number} n
 * @param {number} [bits=32]
 * @return {number[]}
 */
function number2bitArray(n, bits) {
  if (_.isUndefined(bits)) { bits = 32 }

  verify.number(n)
  verify.number(bits)

  return _.range(bits).map(function (shift) { return (n >> shift) & 1 })
}

/**
 * @param {number[]} bits
 * @return {number}
 */
function bitArray2number(bits) {
  verify.array(bits)
  bits.forEach(verify.number)

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
function groupTargetsByColor(targets, targetCls) {
  verify.array(targets)
  verify.function(targetCls)

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
function address2script(address) {
  verify.string(address)

  return bitcoin.Address.fromBase58Check(address).toOutputScript()
}

/**
 * @param {function} fn
 * @param {number} ms
 * @param {*} [ctx]
 * @return {function}
 */
function debounce(fn, ms, ctx) {
  if (_.isUndefined(ctx)) { ctx = null }

  var args = Array.prototype.slice.call(arguments, 3)
  var timeout = null

  return function debounced() {
    var _args = Array.prototype.slice.call(arguments)
    var f = function debouncedCaller() {
      return fn.apply(ctx, args.concat(_args))
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }
    return timeout = setTimeout(f, ms)
  }
}

/**
 * @param {function} fn
 * @param {Object} [opts]
 * @param {boolean} [opts.returnPromise=false]
 * @return {function}
 */
function makeSerial(fn, opts) {
  opts = _.extend({returnPromise: false}, opts)

  verify.function(fn)
  verify.object(opts)
  verify.boolean(opts.returnPromise)

  var queue = []

  var fn1 = function () {
    var ctx = this
    var args = Array.prototype.slice.call(arguments)

    queue.push(Q.defer())
    if (queue.length === 1) {
      queue[0].resolve()
    }

    return _.last(queue).promise.then(function () {
      return fn.apply(ctx, args)

    }).finally(function () {
      queue.shift()
      if (queue.length > 0) {
        queue[0].resolve()
      }

    })
  }
  fn1.name = fn.name + 'Serial'

  var fn2 = function () {
    var ctx = this
    var args = Array.prototype.slice.call(arguments)

    var originalCallback
    if (_.isFunction(_.last(args))) {
      originalCallback = _.last(args)
      args = args.slice(0, -1)
    }

    queue.push(Q.defer())
    if (queue.length === 1) {
      queue[0].resolve()
    }

    _.last(queue).promise.then(function () {
      var deferred = Q.defer()
      function callback() {
        deferred.resolve()
        if (!_.isUndefined(originalCallback)) {
          originalCallback.apply(this, Array.prototype.slice.call(arguments))
        }
      }

      fn.apply(ctx, args.concat([callback]))

      return deferred.promise

    }).catch(function (error) {
      throw error

    }).finally(function () {
      queue.shift()
      if (queue.length > 0) {
        queue[0].resolve()
      }

    }).done()
  }
  fn2.name = fn.name + 'Serial'

  return opts.returnPromise ? fn1 : fn2
}


module.exports = {
  number2bitArray: number2bitArray,
  bitArray2number: bitArray2number,

  groupTargetsByColor: groupTargetsByColor,

  address2script: address2script,

  debounce: debounce,

  makeSerial: makeSerial
}
