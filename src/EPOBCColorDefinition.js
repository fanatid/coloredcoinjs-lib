var assert = require('assert')
var inherits = require('util').inherits

var _ = require('lodash')
var Q = require('q')

var ColorDefinition = require('./ColorDefinition')
var GenesisColorDefinition = require('./GenesisColorDefinition')
var UncoloredColorDefinition = require('./UncoloredColorDefinition')
var ColorValue = require('./ColorValue')
var ColorTarget = require('./ColorTarget')
var Transaction = require('./Transaction')
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

  bits = bits.concat(Array.apply(null, new Array(32-12)).map(function() { return 0 }))

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
 * @param {function} getTxFn
 * @param {EPOBCColorDefinition~runKernel} cb
 */
EPOBCColorDefinition.prototype.runKernel = function(tx, colorValueSet, getTxFn, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isArray(colorValueSet), 'Expected Array colorValueSet, got ' + colorValueSet)
  assert(colorValueSet.every(function(cv) { return (cv === null || cv instanceof ColorValue) }),
    'Expected colorValueSet Array colorValues|null, got ' + colorValueSet)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var self = this

  Q.fcall(function() {
    var tag = getTag(tx)

    if (tag === null || tag.isGenesis) {
      var outColorValues = Array.apply(null, new Array(tx.outs.length)).map(function(){ return null })

      if (tag !== null && self.isSpecialTx(tx)) {
        var valueWop = tx.outs[0].value - tag.getPadding()

        if (valueWop > 0)
          outColorValues[0] = new ColorValue(self, valueWop)
      }

      return outColorValues
    }

    var padding = tag.getPadding()

    return Q.ninvoke(tx, 'ensureInputValues', getTxFn).then(function(tx) {
      var promises = tx.outs.map(function(output, outIndex) {
        var outValueWop = output.value - padding

        if (outValueWop <= 0)
          return null

        var affectingInputs = getXferAffectingInputs(tx, padding, outIndex)
        var allColored = affectingInputs.every(function(ai) {
          return (colorValueSet[ai] !== null && !_.isUndefined(colorValueSet[ai]))
        })

        if (!allColored)
          return null

        var colorValues = [new ColorValue(self, 0 )]
        colorValues = colorValues.concat(affectingInputs.map(function(ai) { return colorValueSet[ai] }))

        var totalColorValue = ColorValue.sum(colorValues)
        if (totalColorValue.getValue() < outValueWop)
          return null

        return new ColorValue(self, outValueWop)
      })

      return Q.all(promises)
    })

  }).done(function(colorValues) { cb(null, colorValues) }, function(error) { cb(error) })
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
 * @param {function} getTxFn
 * @param {function} cb
 */
EPOBCColorDefinition.prototype.getAffectingInputs = function(tx, outputSet, getTxFn, cb) {
  assert(tx instanceof Transaction, 'Expected tx instance of Transaction, got ' + tx)
  assert(_.isArray(outputSet), 'Expected Array outputSet, got ' + outputSet)
  assert(outputSet.every(function(oi) { return _.isNumber(oi) }),
    'Expected outputSet Array numbers, got ' + outputSet)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  Q.fcall(function() {
    var tag = getTag(tx)
    if (tag === null || tag.isGenesis)
      return []

    var padding = tag.getPadding()
    return Q.ninvoke(tx, 'ensureInputValues', getTxFn).then(function(tx) {
      var aii = {}

      outputSet.forEach(function(outIndex) {
        getXferAffectingInputs(tx, padding, outIndex).forEach(function(ai) {
          aii[ai] = 1
        })
      })

      return Object.keys(aii).map(function(ii) { return tx.ins[ii] })
    })

  }).done(function(result) { cb(null, result) }, function(error) { cb(error) })
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
/*
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
*/
    var promise = Q()
    targetsColorIds.forEach(function(targetColorId) {
      promise = promise.then(function() {
        var targets = targetsByColor[targetColorId]
        var neededSum = ColorTarget.sum(targets)

        return Q.ninvoke(operationalTx, 'selectCoins', neededSum, null).spread(function(coins, coinsValue) {
          coinsByColor[targetColorId] = coins

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
        })
      })
    })

    return promise

  }).then(function() {
    composedTx = operationalTx.makeComposedTx()
    tag = new Tag(Tag.closestPaddingCode(minPadding), false)

    // create txins & txouts, compute uncolored requirements
/*
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
*/
    targetsColorIds.forEach(function(targetColorId) {
      coinsByColor[targetColorId].forEach(function(coin) {
        var coinValue = new ColorValue(new UncoloredColorDefinition(), coin.value)
        uncoloredNeeded = uncoloredNeeded.minus(coinValue)
        composedTx.addTxIn(coin)
      })

      targetsByColor[targetColorId].forEach(function(target) {
        var targetValue = target.getValue() + tag.getPadding()
        var uncoloredValue = new ColorValue(new UncoloredColorDefinition(), targetValue)
        uncoloredNeeded = uncoloredNeeded.plus(uncoloredValue)
        composedTx.addTxOut({ address: target.getAddress(), value: targetValue })
      })
    })

  }).then(function() {
    composedTx.addTxOuts(uncoloredTargets.map(function(target) { return {target: target} }))

    fee = composedTx.estimateRequiredFee()
    if (uncoloredNeeded.plus(fee).getValue() <= 0) {
      uncoloredChange = uncoloredNeeded.neg().minus(fee)
      return
    }

    return Q.ninvoke(operationalTx, 'selectCoins', uncoloredNeeded, composedTx).spread(function(coins, coinsValue) {
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

  }).done(function() { cb(null, composedTx) }, function(error) { cb(error) })
}

/**
 * @callback EPOBCColorDefinition~composeGenesisTx
 * @param {?Error} error
 * @param {ComposedTx} composedTx
 */

/**
 * @param {OperationalTx} operationalTx
 * @param {EPOBCColorDefinition~composeGenesisTx} cb
 */
EPOBCColorDefinition.composeGenesisTx = function(operationalTx, cb) {
  var composedTx, uncoloredNeeded, tag

  Q.fcall(function() {
    if (operationalTx.getTargets().length !== 1)
      throw new Error('genesis transaction need exactly one target')

    var gTarget = operationalTx.getTargets()[0]
    if (gTarget.getColorId() !== new GenesisColorDefinition().getColorId())
      throw new Error('transaction target is not genesis')

    var gValue = gTarget.getValue()
    var paddingNeeded = operationalTx.getDustThreshold().getValue() - gValue
    tag = new Tag(Tag.closestPaddingCode(paddingNeeded), true)

    composedTx = operationalTx.makeComposedTx()
    composedTx.addTxOut({ address: gTarget.getAddress(), value: tag.getPadding() + gValue })

    uncoloredNeeded = new ColorValue(new UncoloredColorDefinition(), tag.getPadding() + gValue)

    return Q.ninvoke(operationalTx, 'selectCoins', uncoloredNeeded, composedTx)
  
  }).spread(function(coins, coinsValue) {
    composedTx.addTxIns(coins)
    var fee = composedTx.estimateRequiredFee()
    var uncoloredChange = coinsValue.minus(uncoloredNeeded).minus(fee)
    if (uncoloredChange.getValue() > operationalTx.getDustThreshold().getValue())
      composedTx.addTxOut({
        address: operationalTx.getChangeAddress(new UncoloredColorDefinition()),
        value: uncoloredChange.getValue()
      })

    composedTx.txIns[0].sequence = tag.toSequence()

  }).done(function() { cb(null, composedTx) }, function(error) { cb(error) })
}


EPOBCColorDefinition._Tag = Tag
EPOBCColorDefinition._Tag.number2bitArray = number2bitArray
EPOBCColorDefinition._Tag.bitArray2number = bitArray2number
EPOBCColorDefinition._Tag.getTag = getTag
EPOBCColorDefinition._getXferAffectingInputs = getXferAffectingInputs


module.exports = EPOBCColorDefinition
