var assert = require('assert')
var inherits = require('util').inherits

var _ = require('lodash')

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
 * @return {Array}
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
 * @param {Array} bits
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
 * @callback Tag~closestPaddingCodeCallback
 * @param {Error} error
 * @param {number} result
 */

/**
 * Calculate paddingCode from minPadding
 *
 * @param {number} minPadding
 * @param {Tag~closestPaddingCodeCallback} cb
 */
Tag.closestPaddingCode = function(minPadding, cb) {
  assert(_.isNumber(minPadding), 'Expected number minPadding, got ' + minPadding)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  process.nextTick(function() {
    if (minPadding <= 0) {
      cb(null, 0)
      return
    }

    var paddingCode = 1
    while (Math.pow(2, paddingCode) < minPadding && paddingCode <= 63)
      paddingCode += 1

    if (paddingCode > 63)
      cb(new Error('Requires to much padding'))
    else
      cb(null, paddingCode)
  })
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
 * @return {Tag|null} Tag instance if tx is genesis or xfer and not coinbase
 */
// Todo: move part to static method fromSequence
function getTag(tx) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)

  var isCoinbase = (
    tx.ins[0].hash.toString('hex') === '0000000000000000000000000000000000000000000000000000000000000000' &&
    tx.ins[0].index === 4294967295)
  if (isCoinbase)
    return null

  var nSequence = tx.ins[0].sequence
  var bits = number2bitArray(nSequence)
  var tagBits = bits.slice(0, 6)

  var isXfer = tagBits.every(function(v, i) { return v === Tag.xferTagBits[i] })
  var isGenesis = tagBits.every(function(v, i) { return v === Tag.genesisTagBits[i] })

  if (!(isXfer || isGenesis))
    return null

  var paddingCode = bitArray2number(bits.slice(6, 12))
  return new Tag(paddingCode, isGenesis)
}

/**
 * Returns a Array of indices that correspond to the inputs
 *  for an output in the transaction tx with output index outIndex
 *  which has a padding of padding (2^n for some n>0 or 0)
 *
 * @param {Transaction} tx
 * @param {number} padding
 * @param {number} outIndex
 * @return {Array}
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
 * @class EPOBCColorDefinition
 *
 * Inherits ColorDefinition
 *
 * @param {Object} data
 * @param {Object} genesis
 * @param {string} genesis.txId
 * @param {number} genesis.outIndex
 * @param {number} genesis.height
 */
function EPOBCColorDefinition(data, genesis) {
  ColorDefinition.call(this, data)

  assert(_.isObject(genesis), 'Expected object genesis, got ' + genesis)
  assert(Transaction.isTxId(genesis.txId), 'Expected transaction id txId, got ' + genesis.txId)
  assert(_.isNumber(genesis.outIndex), 'Expected number outIndex, got ' + genesis.outIndex)
  assert(_.isNumber(genesis.height), 'Expected number height, got ' + genesis.height)

  this.genesis = genesis
}

inherits(EPOBCColorDefinition, ColorDefinition)

/**
 * Create EPOBCColorDefinition from data and scheme.
 *  Return null if scheme not describe EPOBCColorDefinition
 *
 * @param {Object} data
 * @param {string} scheme
 * @return {EPOBCColorDefinition|null}
 */
EPOBCColorDefinition.fromScheme = function(data, scheme) {
  assert(_.isString(scheme), 'Expected string scheme, got ' + scheme)

  var colorDefinition = null

  var items = scheme.split(':')
  if (items[0] === 'epobc') {
    try {
      colorDefinition = new EPOBCColorDefinition(data, {
        txId: items[1],
        outIndex: parseInt(items[2]),
        height: parseInt(items[3])
      })

    } catch(e) {
      colorDefinition = null
    }
  }

  return colorDefinition
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
 * Given a transaction tx and the colorValues in a Array colorValueSet,
 *  return the colorValues of the tx.outs in a Array via callback cb
 *
 * @param {Transaction} tx
 * @param {Array} colorValueSet
 * @param {coloredcoinlib.blockchain.BlockchainState} bs
 * @param {function} cb Called on finished with params (error, Array)
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
        outColorValues[0] = new ColorValue({ colordef: this, value: valueWop })
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

    var colorValues = [new ColorValue({ colordef: _this, value: 0 })]
    colorValues = colorValues.concat(affectingInputs.map(function(ai) { return colorValueSet[ai] }))

    ColorValue.sum(colorValues, function(error, result) {
      if (error !== null) {
        cb(error)
        return
      }

      if (result.getValue() >= outValueWop)
        outColorValues.push(new ColorValue({ colordef: _this, value: outValueWop }))
      else
        outColorValues.push(null)

      processOutTx(tx, outIndex+1)
    })
  }
}

/**
 * Given transaction tx, outputIndex in a Array as outputSet and
 *  return affecting inputs of transaction tx in a Array via callback cb
 *
 * @param {Transaction} tx
 * @param {Array} outputSet
 * @param {coloredcoinlib.blockchain.BlockchainState} bs
 * @param {function} cb Called on finished with params (error, Array)
 */
EPOBCColorDefinition.prototype.getAffectingInputs = function(tx, outputSet, bs, cb) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)
  assert(_.isArray(outputSet), 'Expected Array outputSet, got ' + outputSet)
  assert(outputSet.every(function(oi) { return _.isNumber(oi) }),
    'Expected outputSet Array numbers, got ' + outputSet)
  assert(bs instanceof blockchain.BlockchainStateBase, 'Expected BlockchainState bs, got ' + bs)
  assert(_.isFunction(cb), 'Expected function cb, got ' + cb)

  var tag = getTag(tx)

  if (tag === null || tag.isGenesis) {
    cb(null, [])

  } else {
    var padding = tag.getPadding()

    bs.ensureInputValues(tx, function(error, tx) {
      var inputs

      if (error === null) {
        var aii = []

        outputSet.forEach(function(outIndex) {
          getXferAffectingInputs(tx, padding, outIndex).forEach(function(ai) {
            if (aii.indexOf(ai) === -1)
              aii.push(ai)
          })
        })

        inputs = aii.map(function(ii) { return tx.ins[ii] })
      }

      cb(error, inputs)
    })
  }
}

/**
 *
 */
EPOBCColorDefinition.prototype.composeTx = function(operationalTx, cb) {
  var composedTx = operationalTx.makeComposedTx()
  var dustThreshold = operationalTx.getDustThreshold().getValue()
  var inputsByColor = {}
  var minPadding = 0
  var tag
  var fee

  var targetsByColor, targetsColorIds
  var uncoloredTargets, uncoloredNeeded, uncoloredChange

  groupTargetsByColor(operationalTx.getTargets(), EPOBCColorDefinition, function(error, result) {
    if (error !== null) {
      cb(error)
      return
    }

    uncoloredTargets = result[0] || []
    delete result[0]
    targetsByColor = result
    targetsColorIds = Object.keys(targetsByColor)

    if (uncoloredTargets.length === 0)
      uncoloredNeededCallback(null, new ColorValue({ colordef: new UncoloredColorDefinition(), value: 0 }))
    else
      ColorTarget.sum(uncoloredTargets, uncoloredNeededCallback)
  })

  function uncoloredNeededCallback(error, result) {
    if (error !== null) {
      cb(error)
      return
    }

    uncoloredNeeded = result
    step1(0)
  }

  // step 1: get inputs, create change targets, compute min padding
  function step1(index) {
    if (targetsColorIds.length === index) {
      Tag.closestPaddingCode(minPadding, function(error, paddingCode) {
        if (error !== null) {
          cb(error)
          return
        }

        tag = new Tag(paddingCode, false)
        step2(0)
      })
    }

    var targets = targetsByColor[targetsColorIds[index]]

    ColorTarget.sum(targets, function(error, neededSum) {
      if (error !== null) {
        cb(error)
        return
      }

      operationalTx.selectCoins(neededSum, null, function(error, inputs, total) {
        if (error !== null) {
          cb(error)
          return
        }

        inputsByColor[targetsColorIds[index]] = inputs
        total.sub(neededSum, function(error, change) {
          if (error) {
            cb(error)
            return
          }

          if (change.getValue() > 0)
            targets.push(new ColorTarget(
              operationalTx.getChangeAddr(change.getColorDefinition()),
              change
            ))

          targets.forEach(function(target) {
            var paddingNeeded = dustThreshold - target.getValue()
            if (paddingNeeded > minPadding)
              minPadding = paddingNeeded
          })

          step1(index+1)
        })
      })
    })
  }

  // step 2: create txins & txouts, compute uncolored requirements
  function step2(stepIndex) {
    if (targetsColorIds.length === stepIndex) {
      addUncoloredTargets()
      return
    }

    var colorId = targetsColorIds[stepIndex]

    function addTxIn(index) {
      if (inputsByColor[colorId].length === index) {
        addTxOut(0)
        return
      }

      var input = inputsByColor[colorId][index]
      composedTx.addTxIn(input)

      var uncoloredValue = new ColorValue({ colordef: new UncoloredColorDefinition(), value: input.value })
      uncoloredNeeded.sub(uncoloredValue, function(error, result) {
        if (error !== null) {
          cb(error)
          return
        }

        uncoloredNeeded = result
        addTxIn(index+1)
      })
    }

    function addTxOut(index) {
      if (targetsByColor[colorId].length === index) {
        step2(stepIndex+1)
        return
      }

      var target = targetsByColor[colorId][index]
      var targetValue = target.getValue() + tag.getPadding()
      composedTx.addTxOut({ value: targetValue, target: target }, function(error) {
        if (error !== null) {
          cb(error)
          return
        }

        var uncoloredValue = new ColorValue({ colordef: new UncoloredColorDefinition(), value: targetValue })
        uncoloredNeeded.add(uncoloredValue, function(error, result) {
          if (error !== null) {
            cb(error)
            return
          }

          uncoloredNeeded = result
          addTxOut(index+1)
        })
      })
    }

    addTxIn(0)
  }

  function addUncoloredTargets() {
    composedTx.addTxOuts(uncoloredTargets, function(error) {
      if (error !== null) {
        cb(error)
        return
      }

      fee = composedTx.estimateRequiredFee()
      uncoloredNeeded.add(fee, function(error, totalUncoloredNeeded) {
        if (error !== null) {
          cb(error)
          return
        }

        if (totalUncoloredNeeded.getValue() <= 0) {
          uncoloredNeeded.neg().sub(fee, function(error, result) {
            if (error === null) {
              uncoloredChange = result
              addUncoloredChange()

            } else {
              cb(error)

            }
          })
        }

        operationalTx.selectCoins(uncoloredNeeded, composedTx, function(error, inputs, total) {
          if (error !== null) {
            cb(error)
            return
          }

          composedTx.addTxIns(inputs)
          total.sub(uncoloredNeeded, function(error, result) {
            if (error !== null) {
              cb(error)
              return
            }

            result.sub(composedTx.estimateRequiredFee(), function(error, result) {
              if (error === null) {
                uncoloredChange = result
                addUncoloredChange()

              } else {
                cb(error)

              }
            })
          })
        })
      })
    })
  }

  function addUncoloredChange() {
    uncoloredChange.gt(operationalTx.getDustThreshold(), function(error, result) {
      if (error !== null) {
        cb(error)
        return
      }

      if (!result) {
        finish()
        return
      }

      var data = {
        value: uncoloredChange.getValue(),
        targetAddr: operationalTx.getChangeAddr(new UncoloredColorDefinition()),
        isFeeChange: true
      }
      composedTx.addTxOut(data, function(error) {
        if (error === null)
          finish()
        else
          cb(error)
      })
    })
  }

  function finish() {
    composedTx.setSequence(0, tag.toSequence())
    cb(null, composedTx)
  }
}


EPOBCColorDefinition._Tag = Tag
EPOBCColorDefinition._Tag.number2bitArray = number2bitArray
EPOBCColorDefinition._Tag.bitArray2number = bitArray2number
EPOBCColorDefinition._Tag.getTag = getTag
EPOBCColorDefinition._getXferAffectingInputs = getXferAffectingInputs


module.exports = EPOBCColorDefinition
