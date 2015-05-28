/* globals Promise:true */
var _ = require('lodash')
var inherits = require('util').inherits
var Promise = require('bluebird')
var bitcore = require('bitcore')

var IColorDefinition = require('./interface')
var Genesis = require('./genesis')
var Uncolored = require('./uncolored')
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
 * @throws {PaddingError}
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
    throw new errors.ColorDefinition.EPOBC.PaddingError(minPadding)
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
 * @throws {IncorrectDesc}
 */
EPOBCColorDefinition.fromDesc = function (colorId, desc) {
  var items = desc.split(':')
  if (items[0] !== 'epobc') {
    throw new errors.ColorDefinition.IncorrectDesc('EPOBC', desc)
  }

  var genesis = {
    txid: items[1],
    vout: parseInt(items[2], 10),
    height: parseInt(items[3], 10)
  }

  return new EPOBCColorDefinition(colorId, genesis)
}

/**
 * @param {bitcore.Transaction} tx
 * @return {boolean}
 */
EPOBCColorDefinition.prototype.isGenesis = function (tx) {
  return tx.id === this._genesis.txid
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

      if (tag !== null && self.isGenesis(tx)) {
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
 *  for an output in the transaction tx with output index vout
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
 * @param {OperationalTx} optx
 * @return {Promise.<ComposedTx>}
 */
EPOBCColorDefinition.makeComposedTx = function (optx) {
  return Promise.try(function () {
    var targetsByColor = ColorTarget.groupByColorId(
      optx.getTargets(), EPOBCColorDefinition)

    var uncoloredColorId = new Uncolored().getColorId()
    var uncoloredTargets = targetsByColor[uncoloredColorId] || []
    delete targetsByColor[uncoloredColorId]

    var uncoloredNeeded = uncoloredTargets.length === 0
                            ? new ColorValue(new Uncolored(), 0)
                            : ColorTarget.sum(uncoloredTargets)

    var targetsColorIds = _.keys(targetsByColor)
    var dustThreshold = optx.getDustThreshold().getValue()
    var coinsByColor = {}
    var minPadding = 0

    // get inputs, create change targets, compute min padding
    return Promise.reduce(targetsColorIds, function (__, targetColorId) {
      var targets = targetsByColor[targetColorId]
      var neededSum = ColorTarget.sum(targets)

      return optx.selectCoins(neededSum, null)
        .then(function (result) {
          coinsByColor[targetColorId] = _.invoke(result.coins, 'toRawCoin')

          targets.forEach(function (target) {
            var paddingNeeded = dustThreshold - target.getValue()
            minPadding = Math.min(minPadding, paddingNeeded)
          })

          var change = result.total.minus(neededSum)
          if (change.getValue() <= 0) {
            return
          }

          return optx.getChangeAddress(change.getColorDefinition())
            .then(function (changeAddress) {
              var changeScript = bitcore.Script.fromAddress(changeAddress)
              var changeTarget = new ColorTarget(changeScript.toHex(), change)
              targets.push(changeTarget)
            })
        })
    }, null)
    .then(function () {
      var comptx = optx.makeComposedTx()
      var tag = new Tag(Tag.closestPaddingCode(minPadding), false)

      // create inputs & outputs, compute uncolored requirements
      targetsColorIds.forEach(function (targetColorId) {
        coinsByColor[targetColorId].forEach(function (coin) {
          var coinValue = new ColorValue(new Uncolored(), coin.value)
          uncoloredNeeded = uncoloredNeeded.minus(coinValue)
          comptx.addInput(coin)
        })

        targetsByColor[targetColorId].forEach(function (target) {
          var targetValue = target.getValue() + tag.getPadding()
          var uncoloredValue = new ColorValue(new Uncolored(), targetValue)
          uncoloredNeeded = uncoloredNeeded.plus(uncoloredValue)
          comptx.addOutput({script: target.getScript(), value: targetValue})
        })
      })

      comptx.addOutputs(uncoloredTargets.map(function (target) {
        return {target: target}
      }))

      var fee = comptx.estimateRequiredFee()
      if (uncoloredNeeded.plus(fee).getValue() <= 0) {
        return uncoloredNeeded.plus(fee).neg()
      }

      return optx.selectCoins(uncoloredNeeded, comptx)
        .then(function (result) {
          comptx.addInputs(_.invoke(result.coins, 'toRawCoin'))
          comptx.setInputSequence(0, tag.toSequence())

          var fee = comptx.estimateRequiredFee()
          var uncoloredChange = result.total.minus(uncoloredNeeded).minus(fee)
          if (uncoloredChange.getValue() <= dustThreshold) {
            return
          }

          return optx.getChangeAddress(new Uncolored())
            .then(function (changeAddress) {
              comptx.addOutput({
                script: bitcore.Script.fromAddress(changeAddress).toHex(),
                value: uncoloredChange.getValue()
              })
            })
        })
        .then(function () {
          return comptx
        })
    })
  })
}

/**
 * @param {OperationalTx} optx
 * @return {Promise.<ComposedTx>}
 */
EPOBCColorDefinition.composeGenesisTx = function (optx) {
  return Promise.try(function () {
    if (optx.getTargets().length !== 1) {
      throw new errors.ComposeGenesisTxError(
        'Genesis transaction need exactly one target')
    }

    var gtarget = optx.getTargets()[0]
    if (gtarget.getColorId() !== new Genesis().getColorId()) {
      throw new errors.ComposeGenesisTxError(
        'Transaction target is not genesis')
    }

    var paddingNeeded = optx.getDustThreshold().getValue() - gtarget.getValue()
    var tag = new Tag(Tag.closestPaddingCode(paddingNeeded), true)

    var uncoloredValue = tag.getPadding() + gtarget.getValue()
    var uncoloredNeeded = new ColorValue(new Uncolored(), uncoloredValue)

    var comptx = optx.makeComposedTx()
    comptx.addOutput({script: gtarget.getScript(), value: uncoloredValue})

    return optx.selectCoins(uncoloredNeeded, comptx)
      .then(function (result) {
        comptx.addInputs(_.invoke(result.coins, 'toRawCoin'))
        comptx.setInputSequence(0, tag.toSequence())

        var fee = comptx.estimateRequiredFee()
        var uncoloredChange = result.total.minus(uncoloredNeeded).minus(fee)
        if (uncoloredChange.getValue() <= optx.getDustThreshold().getValue()) {
          return comptx
        }

        return optx.getChangeAddress(new Uncolored())
          .then(function (changeAddress) {
            comptx.addOutput({
              script: bitcore.Script.fromAddress(changeAddress).toHex(),
              value: uncoloredChange.getValue()
            })
            return comptx
          })
      })
  })
}

EPOBCColorDefinition._Tag = Tag
ColorDefinitionManager.registerColorDefinition(EPOBCColorDefinition)

module.exports = EPOBCColorDefinition
