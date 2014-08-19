var assert = require('assert')
var inherits = require('util').inherits

var _ = require('lodash')
var Q = require('q')

var ColorDefinition = require('./ColorDefinition')
var UncoloredColorDefinition = require('./UncoloredColorDefinition')
var ColorValue = require('./ColorValue')
var ColorTarget = require('./ColorTarget')
var blockchain = require('../blockchain')
var Transaction = require('../tx').Transaction
var groupTargetsByColor = require('./util').groupTargetsByColor


/**
 * @param {number} n
 * @param {number} [bits=32]
 * @return {number[]}
 */
function number2bitArray(n, bits) {
  assert(_.isNumber(n), 'Expected number n, got ' + n)
  bits = _.isUndefined(bits) ? 32 : bits
  assert(_.isNumber(bits), 'Expected number bits, got ' + bits)

  var result = []
  for (var i = 0; i < bits; ++i)
    result.push(1 & (n >> i))
  return result
}

/**
 * @param {number[]} bits
 * @return {number}
 */
function bitArray2number(bits) {
  assert(_.isArray(bits), 'Expected Array bits, got ' + bits)
  assert(bits.every(function(bit) { return (bit&1) === bit }),
    'Expected Array bits (i.e. 0 or 1), got ' + bits)

  var n = 0
  var factor = 1

  for (var i in bits) {
    if (bits[i] === 1)
      n += factor

    factor = factor * 2
  }

  return n
}

/**
 * @class Tag
 *
 * @param {number} paddingCode
 * @param {boolean} isGenesis
 */
function Tag(paddingCode, isGenesis) {
  assert(_.isNumber(paddingCode), 'Expected number paddingCode, got ' + paddingCode)
  assert(_.isBoolean(isGenesis), 'Expected boolean isGenesis, got ' + isGenesis)

  this.paddingCode = paddingCode
  this.isGenesis = isGenesis
}

Tag.xferTagBits = [1, 1, 0, 0, 1, 1]
Tag.genesisTagBits = [1, 0, 1, 0, 0, 1]


/**
 * Calculate paddingCode from minPadding
 *
 * @param {number} minPadding
 * @return {number}
 * @throws {Error} If paddingCode greater that 63
 */
Tag.closestPaddingCode = function(minPadding) {
  assert(_.isNumber(minPadding), 'Expected number minPadding, got ' + minPadding)

  if (minPadding <= 0)
    return 0

  var paddingCode = 1
  while (Math.pow(2, paddingCode) < minPadding && paddingCode <= 63)
    paddingCode += 1

  if (paddingCode > 63)
    throw new Error('Requires to much padding')

  return paddingCode
}

/**
 * Create new Tag from sequence
 *
 * @param {number} sequence
 * @return {Tag}
 */
Tag.fromSequence = function(sequence) {
  var bits = number2bitArray(sequence)
  var tagBits = bits.slice(0, 6)

  var isXfer = tagBits.every(function(v, i) { return v === Tag.xferTagBits[i] })
  var isGenesis = tagBits.every(function(v, i) { return v === Tag.genesisTagBits[i] })

  if (!(isXfer || isGenesis))
    return null

  var paddingCode = bitArray2number(bits.slice(6, 12))
  return new Tag(paddingCode, isGenesis)
}

/**
 * @return {number}
 */
Tag.prototype.toSequence = function() {
  var bits = []

  if (this.isGenesis)
    bits = bits.concat(Tag.genesisTagBits)
  else
    bits = bits.concat(Tag.xferTagBits)

  bits = bits.concat(number2bitArray(this.paddingCode, 6))

  bits = bits.concat(new Array(32-12).map(function() { return 0 }))

  return bitArray2number(bits)
}

/**
 * @return {number}
 */
Tag.prototype.getPadding = function() {
  if (this.paddingCode === 0)
    return 0
  else
    return Math.pow(2, this.paddingCode)
}


/**
 * @param {Transaction} tx
 * @return {?Tag} Tag instance if tx is genesis or xfer and not coinbase
 */
function getTag(tx) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)

  var isCoinbase = (
    tx.ins[0].hash.toString('hex') === '0000000000000000000000000000000000000000000000000000000000000000' &&
    tx.ins[0].index === 4294967295)
  if (isCoinbase)
    return null

  return Tag.fromSequence(tx.ins[0].sequence)
}

/**
 * Returns a Array of indices that correspond to the inputs
 *  for an output in the transaction tx with output index outIndex
 *  which has a padding of padding (2^n for some n>0 or 0)
 *
 * @param {Transaction} tx
 * @param {number} padding
 * @param {number} outIndex
 * @return {number[]}
 */
function getXferAffectingInputs(tx, padding, outIndex) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isNumber(padding), 'Expected padding number, got ' + padding)
  assert(_.isNumber(outIndex), 'Expected outIndex number, got ' + outIndex)

  var valueWop
  var outValueWop
  var outPrecSum = 0

  for (var oi = 0; oi < outIndex; ++oi) {
    valueWop = tx.outs[oi].value - padding
    if (valueWop <= 0)
      return []

    outPrecSum += valueWop
  }

  outValueWop = tx.outs[outIndex].value - padding
  if (outValueWop <= 0)
    return []

  var affectingInputs = []
  var inputRunningSum = 0

  for (var ii = 0; ii < tx.ins.length; ++ii) {
    var prevTag = getTag(tx.ins[ii].prevTx)
    if (prevTag === null)
      break

    valueWop = tx.ins[ii].value - prevTag.getPadding()
    if (valueWop <= 0)
      break

    var isAffectingInput = (
      inputRunningSum < (outPrecSum + outValueWop) &&
      (inputRunningSum + valueWop) > outPrecSum)

    if (isAffectingInput)
      affectingInputs.push(ii)

    inputRunningSum += valueWop
  }

  return affectingInputs
}


/**
 * @typedef {Object} EPOBCColorDefinitionGenesis
 * @param {string} txId
 * @param {number} outIndex
 * @param {number} height
 */

/**
 * @class EPOBCColorDefinition
 *
 * Inherits ColorDefinition
 *
 * @param {number} colorId
 * @param {EPOBCColorDefinitionGenesis} genesis
 */
function EPOBCColorDefinition(colorId, genesis) {
  ColorDefinition.call(this, colorId)

  assert(_.isObject(genesis), 'Expected object genesis, got ' + genesis)
  assert(Transaction.isTxId(genesis.txId), 'Expected transaction id txId, got ' + genesis.txId)
  assert(_.isNumber(genesis.outIndex), 'Expected number outIndex, got ' + genesis.outIndex)
  assert(_.isNumber(genesis.height), 'Expected number height, got ' + genesis.height)

  this.genesis = genesis
}

inherits(EPOBCColorDefinition, ColorDefinition)

/**
 * @return {string}
 */
EPOBCColorDefinition.prototype.getColorType = function() {
  return 'epobc'
}

/**
 * Create EPOBCColorDefinition from colorId and scheme
 *
 * @param {number} colorId
 * @param {string} scheme
 * @return {EPOBCColorDefinition}
 * @throws {Error} On wrong scheme
 */
// Todo: add exceptions
EPOBCColorDefinition.fromScheme = function(colorId, scheme) {
  assert(_.isString(scheme), 'Expected string scheme, got ' + scheme)

  var items = scheme.split(':')
  if (items[0] !== 'epobc')
    throw new Error('Wrong scheme')

  var genesis = {
    txId: items[1],
    outIndex: parseInt(items[2]),
    height: parseInt(items[3])
  }

  return new EPOBCColorDefinition(colorId, genesis)
}

/**
 * Return scheme as string described this colorDefinition
 *
 * @return {string}
 */
EPOBCColorDefinition.prototype.getScheme = function() {
  var data = ['epobc', this.genesis.txId, this.genesis.outIndex, this.genesis.height]
  return data.join(':')
}

/**
 * @param {Transaction} tx
 * @return {boolean}
 */
EPOBCColorDefinition.prototype.isSpecialTx = function(tx) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)

  var isSpecialTx = tx.getId() === this.genesis.txId

  return isSpecialTx
}

/**
 * @callback EPOBCColorDefinition~runKernel
 * @param {?Error} error
 * @param {?ColorValue[]} colorValues
 */

/**
 * Given a transaction tx and the colorValues in a Array colorValueSet,
 *  return the colorValues of the tx.outs in a Array via callback cb
 *
 * @param {Transaction} tx
 * @param {?ColorValue[]} colorValueSet
 * @param {coloredcoinlib.blockchain.BlockchainState} bs
 * @param {EPOBCColorDefinition~runKernel} cb
 */
EPOBCColorDefinition.prototype.runKernel = function(tx, colorValueSet, bs, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isArray(colorValueSet), 'Expected Array colorValueSet, got ' + colorValueSet)
  assert(colorValueSet.every(function(cv) { return (cv === null || cv instanceof ColorValue) }),
    'Expected colorValueSet Array colorValues|null, got ' + colorValueSet)
  assert(bs instanceof blockchain.BlockchainStateBase, 'Expected BlockchainState bs, got ' + bs)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var _this = this

  var outColorValues = []
  var tag = getTag(tx)

  if (tag === null || tag.isGenesis) {
    outColorValues = Array.apply(null, new Array(tx.outs.length)).map(function(){ return null })

    if (tag !== null && this.isSpecialTx(tx)) {
      var valueWop = tx.outs[0].value - tag.getPadding()

      if (valueWop > 0)
        outColorValues[0] = new ColorValue(this, valueWop)
    }

    cb(null, outColorValues)
    return
  }

  bs.ensureInputValues(tx, function(error, tx) {
    if (error !== null) {
      cb(error)
      return
    }

    processOutTx(tx, 0)
  })

  function processOutTx(tx, outIndex) {
    if (tx.outs.length === outIndex) {
      cb(null, outColorValues)
      return
    }

    var padding = tag.getPadding()
    var outValueWop = tx.outs[outIndex].value - padding

    if (outValueWop <= 0) {
      outColorValues.push(null)
      processOutTx(tx, outIndex+1)
      return
    }

    var affectingInputs = getXferAffectingInputs(tx, padding, outIndex)
    var allColored = affectingInputs.every(function(ai) {
      return (colorValueSet[ai] !== null && !_.isUndefined(colorValueSet[ai]))
    })

    if (!allColored) {
      outColorValues.push(null)
      processOutTx(tx, outIndex+1)
      return
    }

    var colorValues = [new ColorValue(_this, 0 )]
    colorValues = colorValues.concat(affectingInputs.map(function(ai) { return colorValueSet[ai] }))

    var totalColorValue = ColorValue.sum(colorValues)
    if (totalColorValue.getValue() >= outValueWop)
      outColorValues.push(new ColorValue(_this, outValueWop))
    else
      outColorValues.push(null)

    processOutTx(tx, outIndex+1)
  }
}

/**
 * @callback EPOBCColorDefinition~getAffectingInputs
 * @param {?Error} error
 * @param {Object[]} affectingInputs
 */

/**
 * Given transaction tx, outputIndex in a Array as outputSet and
 *  return affecting inputs of transaction tx in a Array via callback cb
 *
 * @param {Transaction} tx
 * @param {number[]} outputSet
 * @param {BlockchainStateBase} bs
 * @param {function} cb
 */
EPOBCColorDefinition.prototype.getAffectingInputs = function(tx, outputSet, bs, cb) {
  assert(tx instanceof Transaction, 'Expected tx instance of Transaction, got ' + tx)
  assert(_.isArray(outputSet), 'Expected Array outputSet, got ' + outputSet)
  assert(outputSet.every(function(oi) { return _.isNumber(oi) }),
    'Expected outputSet Array numbers, got ' + outputSet)
  assert(bs instanceof blockchain.BlockchainStateBase, 'Expected BlockchainState bs, got ' + bs)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  Q.fcall(function() {
    var tag = getTag(tx)
    if (tag === null || tag.isGenesis)
      return []

    var padding = tag.getPadding()
    return Q.ninvoke(bs, 'ensureInputValues', tx)
      .then(function(tx) {
        var aii = {}

        outputSet.forEach(function(outIndex) {
          getXferAffectingInputs(tx, padding, outIndex).forEach(function(ai) {
            aii[ai] = 1
          })
        })

        return Object.keys(aii).map(function(ii) { return tx.ins[ii] })
      })

  }).then(function(result) {
    cb(null, result)

  }).fail(function(error) {
    cb(error)

  })
}

/**
 * @callback EPOBCColorDefinition~makeComposedTx
 * @param {?Error} error
 * @param {ComposedTx} composedTx
 */

/**
 * Create ComposeTx from OperationalTx
 *
 * @param {OperationalTx} operationalTx
 * @param {EPOBCColorDefinition~makeComposedTx} cb
 */
EPOBCColorDefinition.makeComposedTx = function(operationalTx, cb) {
  var targetsByColor, targetsColorIds
  var uncoloredTargets, uncoloredNeeded, uncoloredChange
  var dustThreshold, coinsByColor, minPadding
  var composedTx, tag, fee

  Q.fcall(function() {
    targetsByColor = groupTargetsByColor(operationalTx.getTargets(), EPOBCColorDefinition)

    uncoloredTargets = targetsByColor[new UncoloredColorDefinition().getColorId()] || []
    delete targetsByColor[new UncoloredColorDefinition().getColorId()]

    if (uncoloredTargets.length === 0)
      uncoloredNeeded = new ColorValue(new UncoloredColorDefinition(), 0)
    else
      uncoloredNeeded = ColorTarget.sum(uncoloredTargets)

    targetsColorIds = Object.keys(targetsByColor)
    dustThreshold = operationalTx.getDustThreshold()
    coinsByColor = {}
    minPadding = 0

    // get inputs, create change targets, compute min padding
    function step1(index) {
      if (targetsColorIds.length === index)
        return

      var targets = targetsByColor[targetsColorIds[index]]
      var neededSum = ColorTarget.sum(targets)

      return Q.ninvoke(operationalTx, 'selectCoins', neededSum, null)
        .spread(function(coins, coinsValue) {
          coinsByColor[targetsColorIds[index]] = coins

          var change = coinsValue.minus(neededSum)
          if (change.getValue() > 0)
            targets.push(new ColorTarget(
              operationalTx.getChangeAddress(change.getColorDefinition()),
              change
            ))

          targets.forEach(function(target) {
            var paddingNeeded = dustThreshold.getValue() - target.getValue()
            if (paddingNeeded > minPadding)
              minPadding = paddingNeeded
          })

          return step1(index+1)
        })
    }

    return step1(0)

  }).then(function() {
    composedTx = operationalTx.makeComposedTx()
    tag = new Tag(Tag.closestPaddingCode(minPadding), false)

    // create txins & txouts, compute uncolored requirements
    function step2(index) {
      if (targetsColorIds.length === index)
        return

      coinsByColor[targetsColorIds[index]].forEach(function(coin) {
        var coinValue = new ColorValue(new UncoloredColorDefinition(), coin.value)
        uncoloredNeeded = uncoloredNeeded.minus(coinValue)
        composedTx.addTxIn(coin)
      })

      targetsByColor[targetsColorIds[index]].forEach(function(target) {
        var targetValue = target.getValue() + tag.getPadding()
        var uncoloredValue = new ColorValue(new UncoloredColorDefinition(), targetValue)
        uncoloredNeeded = uncoloredNeeded.plus(uncoloredValue)
        composedTx.addTxOut({ address: target.getAddress(), value: targetValue })
      })

      return step2(index+1)
    }

    return step2(0)

  }).then(function() {
    composedTx.addTxOuts(uncoloredTargets)

    fee = composedTx.estimateRequiredFee()
    if (uncoloredNeeded.plus(fee).getValue() <= 0) {
      uncoloredChange = uncoloredNeeded.neg().minus(fee)
      return
    }

    return Q.ninvoke(operationalTx, 'selectCoins', uncoloredNeeded, composedTx)
      .spread(function(coins, coinsValue) {
        composedTx.addTxIns(coins)
        fee = composedTx.estimateRequiredFee()
        uncoloredChange = coinsValue.minus(uncoloredNeeded).minus(fee)
      })

  }).then(function() {
    if (uncoloredChange.getValue() > dustThreshold.getValue())
      composedTx.addTxOut({
        address: operationalTx.getChangeAddress(new UncoloredColorDefinition()),
        value: uncoloredChange.getValue()
      })

    composedTx.txIns[0].sequence = tag.toSequence()

  }).then(function() {
    cb(null, composedTx)

  }).fail(function(error) {
    cb(error)

  }).done()
}


EPOBCColorDefinition._Tag = Tag
EPOBCColorDefinition._Tag.number2bitArray = number2bitArray
EPOBCColorDefinition._Tag.bitArray2number = bitArray2number
EPOBCColorDefinition._Tag.getTag = getTag
EPOBCColorDefinition._getXferAffectingInputs = getXferAffectingInputs


module.exports = EPOBCColorDefinition
