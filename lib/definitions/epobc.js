/* globals Promise:true */
var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var bitcore = require('bitcore')

var IColorDefinition = require('./interface')
var ColorDefinitionManager = require('./manager')
var ColorValue = require('../colorvalue')
var ColorTarget = require('../colortarget')
var errors = require('../errors')
var FilledInputsTx = require('../tx/filledinputs')
var bitcoinUtil = require('../util/bitcoin')

/**
 *
 * @class Tag
 * @param {number} paddingCode
 * @param {boolean} isGenesis
 */
function Tag (paddingCode, isGenesis) {
  this._paddingCode = paddingCode
  this._isGenesis = isGenesis
}

Tag.xferTagBits = [1, 1, 0, 0, 1, 1] // 51
Tag.genesisTagBits = [1, 0, 1, 0, 0, 1] // 37

/**
 * @param {number} n
 * @param {number} [bits=32]
 * @return {number[]}
 */
Tag._number2bitArray = function (n, bits) {
  if (bits === undefined) {
    bits = 32
  }

  return _.range(bits).map(function (shift) { return (n >> shift) & 1 })
}

/**
 * @param {number[]} bits
 * @return {number}
 */
Tag._bitArray2number = function (bits) {
  return bits.reduce(function (number, value, index) {
    return number + value * Math.pow(2, index)
  }, 0)
}

/**
 * @param {number} minPadding
 * @return {number}
 * @throws {EPOBCPaddingError}
 */
Tag.closestPaddingCode = function (minPadding) {
  if (minPadding <= 0) {
    return 0
  }

  var paddingCode = 1
  while (Math.pow(2, paddingCode) < minPadding && paddingCode <= 63) {
    paddingCode += 1
  }

  if (paddingCode > 63) {
    var msg = 'Required ' + minPadding + ', otherwise max ' + Math.pow(2, 63)
    throw new errors.EPOBCPaddingError(msg)
  }

  return paddingCode
}

/**
 * Create Tag or return null if tx have genesis or xfer sequence
 * @param {bitcore.Transaction} tx
 * @return {?Tag}
 */
Tag.fromTx = function (tx) {
  var isCoinbase = tx.inputs[0].outputIndex === 4294967295 &&
                   tx.inputs[0].prevTxId.toString('hex') === bitcoinUtil.zeroHash
  if (isCoinbase) {
    return null
  }

  return Tag.fromSequence(tx.inputs[0].sequenceNumber)
}

/**
 * Create Tag or return null if sequence is not genesis or xfer
 * @param {number} sequence
 * @return {?Tag}
 */
Tag.fromSequence = function (sequence) {
  var bits = Tag._number2bitArray(sequence)
  var tagBits = bits.slice(0, 6)

  var isXfer = _.isEqual(Tag.xferTagBits, tagBits)
  var isGenesis = _.isEqual(Tag.genesisTagBits, tagBits)

  if (!(isXfer || isGenesis)) {
    return null
  }

  var paddingCode = Tag._bitArray2number(bits.slice(6, 12))
  return new Tag(paddingCode, isGenesis)
}

/**
 * @return {number}
 */
Tag.prototype.getPadding = function () {
  if (this._paddingCode === 0) {
    return 0
  }

  return Math.pow(2, this._paddingCode)
}

/**
 * @return {boolean}
 */
Tag.prototype.isGenesis = function () {
  return this._isGenesis
}

/**
 * @return {number}
 */
Tag.prototype.toSequence = function () {
  var bits = Array.prototype.concat(
    this._isGenesis ? Tag.genesisTagBits : Tag.xferTagBits,
    Tag._number2bitArray(this._paddingCode, 6),
    _.range(20).map(function () { return 0 })
  )

  return Tag._bitArray2number(bits)
}

/**
 * @class EPOBCColorDefinition
 * @extends IColorDefinition
 *
 * @param {number} colorId
 * @param {Object} genesis
 * @param {string} genesis.txid
 * @param {number} genesis.vout
 * @param {number} genesis.height
 */
function EPOBCColorDefinition (colorId, genesis) {
  IColorDefinition.call(this, colorId)
  this._genesis = genesis
}

_.extend(EPOBCColorDefinition, IColorDefinition)
inherits(EPOBCColorDefinition, IColorDefinition)

/**
 * @return {string}
 */
EPOBCColorDefinition.getColorCode = function () {
  return 'epobc'
}

/**
 * @return {string}
 */
EPOBCColorDefinition.prototype.getDesc = function () {
  var items = [
    'epobc',
    this._genesis.txid,
    this._genesis.vout,
    this._genesis.height
  ]
  return items.join(':')
}

/**
 * @param {number} colorId
 * @param {string} desc
 * @return {EPOBCColorDefinition}
 * @throws {ColorDefinitionBadDescError}
 */
EPOBCColorDefinition.fromDesc = function (colorId, desc) {
  var items = desc.split(':')
  if (items[0] !== 'epobc') {
    throw new errors.ColorDefinitionBadDescError('EPOBC fail load: ' + desc)
  }

  var genesis = {
    txid: items[1],
    vout: parseInt(items[2], 10),
    height: parseInt(items[3], 10)
  }

  return new EPOBCColorDefinition(colorId, genesis)
}

/**
 * Return an array of color value for every transaction output
 *
 * @param {bitcore.Transaction} tx
 * @param {Array.<?ColorValue>} inColorValues
 * @param {getTxFn} getTxFn
 * @return {Promise<Array.<?ColorValue>>}
 */
EPOBCColorDefinition.prototype.runKernel =
function (tx, inColorValues, getTxFn) {
  var self = this

  return Promise.try(function () {
    var tag = Tag.fromTx(tx)
    if (tag === null || tag.isGenesis()) {
      var outColorValues = _.range(tx.outputs.length).map(function () {
        return null
      })

      if (tag !== null && tx.id === self._genesis.txid) {
        var valueWop = tx.outputs[0].satoshis - tag.getPadding()
        if (valueWop > 0) {
          outColorValues[0] = new ColorValue(self, valueWop)
        }
      }

      return outColorValues
    }

    var padding = tag.getPadding()
    var ftx = new FilledInputsTx(tx, getTxFn)
    return ftx.ready
      .then(function () {
        return Promise.map(tx.outputs, function (output, vout) {
          var outValueWop = output.satoshis - padding
          if (outValueWop <= 0) {
            return null
          }

          return EPOBCColorDefinition._getXferAffectingInputs(ftx, padding, vout)
            .then(function (affectingInputs) {
              var aiColorValue = new ColorValue(self, 0)

              var allColored = affectingInputs.every(function (ai) {
                var isColored = inColorValues[ai] !== null
                if (isColored) {
                  aiColorValue = aiColorValue.plus(inColorValues[ai])
                }

                return isColored
              })

              if (!allColored || aiColorValue.getValue() < outValueWop) {
                return null
              }

              return new ColorValue(self, outValueWop)
            })
        })
      })
  })
}

/**
 * Returns a Array of indices that correspond to the inputs
 *  for an output in the transaction tx with output index outIndex
 *  which has a padding of padding (2^n for some n > 0 or 0)
 *
 * @private
 * @param {FilledInputsTx} ftx
 * @param {number} padding
 * @param {number} vout
 * @return {Promise.<number[]>}
 */
EPOBCColorDefinition._getXferAffectingInputs = function (ftx, padding, vout) {
  return Promise.try(function () {
    var tx = ftx.getTx()

    var valueWop
    var outPrecSum = 0

    for (var oi = 0; oi < vout; ++oi) {
      valueWop = tx.outputs[oi].satoshis - padding
      if (valueWop <= 0) {
        return []
      }

      outPrecSum += valueWop
    }

    var outValueWop = tx.outputs[vout].satoshis - padding
    if (outValueWop <= 0) {
      return []
    }

    var affectingInputs = []
    var inputRunningSum = 0

    function checkInput (index) {
      if (index >= tx.inputs.length) {
        return affectingInputs
      }

      return Promise.all([ftx.getInputTx(index), ftx.getInputValue(index)])
        .spread(function (prevTx, prevValue) {
          var prevTag = Tag.fromTx(prevTx)
          if (prevTag === null) {
            return
          }

          valueWop = prevValue - prevTag.getPadding()
          if (valueWop <= 0) {
            return
          }

          var isAffectingInput = inputRunningSum < (outPrecSum + outValueWop) &&
                                 (inputRunningSum + valueWop) > outPrecSum

          if (isAffectingInput) {
            affectingInputs.push(index)
          }

          inputRunningSum += valueWop

          return checkInput(index + 1)
        })
    }

    return checkInput(0)
  })
}

/**
 * Return array of input indices
 *  for given tx and output indices given in vouts
 *
 * @param {bitcore.Transaction} tx
 * @param {number[]} vouts
 * @param {getTxFn} getTxFn
 * @return {Promise.<number[]>}
 */
EPOBCColorDefinition.getAffectingInputs = function (tx, vouts, getTxFn) {
  return Promise.try(function () {
    var tag = Tag.fromTx(tx)
    if (tag === null || tag.isGenesis()) {
      return []
    }

    var ftx = new FilledInputsTx(tx, getTxFn)
    return ftx.ready
      .then(function () {
        var padding = tag.getPadding()
        return Promise.map(vouts, function (vout) {
          return EPOBCColorDefinition._getXferAffectingInputs(ftx, padding, vout)
        })
        .then(function (result) {
          var indices = _.flatten(result)
          return _.uniq(indices)
        })
      })
  })
}

/**
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
EPOBCColorDefinition.makeComposedTx = function (operationalTx) {
  var targetsByColor
  var targetsColorIds
  var uncoloredTargets
  var uncoloredNeeded
  var dustThreshold
  var coinsByColor
  var minPadding
  var composedTx
  var tag

  return Promise.try(function () {
    targetsByColor = ColorTarget.groupByColorId(operationalTx.getTargets(), EPOBCColorDefinition)

    var uncoloredColorId = ColorDefinitionManager.getUncolored().colorId
    uncoloredTargets = targetsByColor[uncoloredColorId] || []
    delete targetsByColor[uncoloredColorId]

    if (uncoloredTargets.length === 0) {
      uncoloredNeeded = new ColorValue(ColorDefinitionManager.getUncolored(), 0)
    } else {
      uncoloredNeeded = ColorTarget.sum(uncoloredTargets)
    }

    targetsColorIds = Object.keys(targetsByColor)
    dustThreshold = operationalTx.getDustThreshold()
    coinsByColor = {}
    minPadding = 0

    // get inputs, create change targets, compute min padding
    return Promise.reduce(targetsColorIds, function (__, targetColorId) {
      var targets = targetsByColor[targetColorId]
      var neededSum = ColorTarget.sum(targets)

      return Promise.fromNode(operationalTx.selectCoins.bind(operationalTx, neededSum, null))
        .spread(function (coins, coinsValue) {
          coinsByColor[targetColorId] = coins.map(function (coin) {
            return coin.toRawCoin()
          })

          var change = coinsValue.minus(neededSum)
          if (change.getValue() > 0) {
            var changeAddress = operationalTx.getChangeAddress(change.getColorDefinition())
            var changeScript = bitcore.Script.fromAddress(changeAddress)
            var changeTarget = new ColorTarget(changeScript.toHex(), change)
            targets.push(changeTarget)
          }

          targets.forEach(function (target) {
            var paddingNeeded = dustThreshold.getValue() - target.getValue()
            if (paddingNeeded > minPadding) { minPadding = paddingNeeded }
          })
        })
    }, null)
  })
  .then(function () {
    composedTx = operationalTx.makeComposedTx()
    tag = new Tag(Tag.closestPaddingCode(minPadding), false)

    // create txins & txouts, compute uncolored requirements
    targetsColorIds.forEach(function (targetColorId) {
      coinsByColor[targetColorId].forEach(function (coin) {
        var coinValue = new ColorValue(ColorDefinitionManager.getUncolored(), coin.value)
        uncoloredNeeded = uncoloredNeeded.minus(coinValue)
        composedTx.addTxIn(coin)
      })

      targetsByColor[targetColorId].forEach(function (target) {
        var targetValue = target.getValue() + tag.getPadding()
        var uncoloredValue = new ColorValue(ColorDefinitionManager.getUncolored(), targetValue)
        uncoloredNeeded = uncoloredNeeded.plus(uncoloredValue)
        composedTx.addTxOut({script: target.getScript(), value: targetValue})
      })
    })

    composedTx.addTxOuts(uncoloredTargets.map(function (target) {
      return {target: target}
    }))

    var fee = composedTx.estimateRequiredFee()
    if (uncoloredNeeded.plus(fee).getValue() <= 0) {
      return uncoloredNeeded.plus(fee).neg()
    }

    return Promise.fromNode(operationalTx.selectCoins.bind(operationalTx, uncoloredNeeded, composedTx))
      .spread(function (coins, coinsValue) {
        composedTx.addTxIns(coins.map(function (coin) {
          return coin.toRawCoin()
        }))
        fee = composedTx.estimateRequiredFee()
        return coinsValue.minus(uncoloredNeeded).minus(fee)
      })
  })
  .then(function (uncoloredChange) {
    if (uncoloredChange.getValue() > dustThreshold.getValue()) {
      var uncoloredAddress = operationalTx.getChangeAddress(ColorDefinitionManager.getUncolored())
      var script = bitcore.Script.fromAddress(uncoloredAddress)
      composedTx.addTxOut({
        script: script.toHex(),
        value: uncoloredChange.getValue()
      })
    }

    composedTx.setTxInSequence(0, tag.toSequence())
    return composedTx
  })
}

/**
 * @param {OperationalTx} operationalTx
 * @return {Promise.<ComposedTx>}
 */
EPOBCColorDefinition.composeGenesisTx = function (operationalTx) {
  var tag
  var composedTx
  var uncoloredNeeded

  return Promise.try(function () {
    if (operationalTx.getTargets().length !== 1) {
      throw new errors.ComposeGenesisTxError('Genesis transaction need exactly one target')
    }

    var gTarget = operationalTx.getTargets()[0]
    if (gTarget.getColorId() !== ColorDefinitionManager.getGenesis().getColorId()) {
      throw new errors.IncompatibilityColorDefinitionsError('Transaction target is not genesis')
    }

    var gValue = gTarget.getValue()
    var paddingNeeded = operationalTx.getDustThreshold().getValue() - gValue
    tag = new Tag(Tag.closestPaddingCode(paddingNeeded), true)

    composedTx = operationalTx.makeComposedTx()
    composedTx.addTxOut({script: gTarget.getScript(), value: tag.getPadding() + gValue})

    uncoloredNeeded = new ColorValue(ColorDefinitionManager.getUncolored(), tag.getPadding() + gValue)

    return Promise.fromNode(operationalTx.selectCoins.bind(operationalTx, uncoloredNeeded, composedTx))
  })
  .spread(function (coins, coinsValue) {
    composedTx.addTxIns(coins.map(function (coin) {
      return coin.toRawCoin()
    }))

    var fee = composedTx.estimateRequiredFee()
    var uncoloredChange = coinsValue.minus(uncoloredNeeded).minus(fee)
    if (uncoloredChange.getValue() > operationalTx.getDustThreshold().getValue()) {
      var uncoloredAddress = operationalTx.getChangeAddress(ColorDefinitionManager.getUncolored())
      var script = bitcore.Script.fromAddress(uncoloredAddress)
      composedTx.addTxOut({
        script: script.toHex(),
        value: uncoloredChange.getValue()
      })
    }

    composedTx.setTxInSequence(0, tag.toSequence())
    return composedTx
  })
}

EPOBCColorDefinition._Tag = Tag
ColorDefinitionManager.registerColorDefinition(EPOBCColorDefinition)

module.exports = EPOBCColorDefinition
