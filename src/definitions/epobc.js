import _ from 'lodash'
import bitcore from 'bitcore-lib'

import IColorDefinition from './interface'
import ColorDefinitionManager from './manager'
import ColorValue from '../colorvalue'
import ColorTarget from '../colortarget'
import FilledInputsTx from '../tx/filledinputs'
import errors from '../errors'
import { ZERO_HASH } from '../util/const'
import { getArrayOfNull } from '../util/js'

/**
 *
 * @class Tag
 */
class Tag {
  /**
   * @constructor
   * @param {number} paddingCode
   * @param {boolean} isGenesis
   */
  constructor (paddingCode, isGenesis) {
    this._paddingCode = paddingCode
    this._isGenesis = isGenesis
  }

  static xferTagBits = [1, 1, 0, 0, 1, 1] // 51
  static genesisTagBits = [1, 0, 1, 0, 0, 1] // 37

  /**
   * @static
   * @param {number} n
   * @param {number} [bits=32]
   * @return {number[]}
   */
  static _number2bitArray (n, bits = 32) {
    return _.range(bits).map((shift) => {
      return (n >> shift) & 1
    })
  }

  /**
   * @static
   * @param {number[]} bits
   * @return {number}
   */
  static _bitArray2number (bits) {
    return bits.reduce((number, value, index) => {
      return number + value * Math.pow(2, index)
    }, 0)
  }

  /**
   * @static
   * @param {number} minPadding
   * @return {number}
   * @throws {PaddingError}
   */
  static closestPaddingCode (minPadding) {
    if (minPadding <= 0) {
      return 0
    }

    let paddingCode = 1
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
   * @static
   * @param {bitcore.Transaction} tx
   * @return {?Tag}
   */
  static fromTx (tx) {
    let isCoinbase = tx.inputs[0].outputIndex === 0xffffffff &&
                     tx.inputs[0].prevTxId.toString('hex') === ZERO_HASH
    if (isCoinbase) {
      return null
    }

    return Tag.fromSequence(tx.inputs[0].sequenceNumber)
  }

  /**
   * Create Tag or return null if sequence is not genesis or xfer
   * @static
   * @param {number} sequence
   * @return {?Tag}
   */
  static fromSequence (sequence) {
    let bits = Tag._number2bitArray(sequence)
    let tagBits = bits.slice(0, 6)

    let isXfer = _.isEqual(Tag.xferTagBits, tagBits)
    let isGenesis = _.isEqual(Tag.genesisTagBits, tagBits)

    if (!(isXfer || isGenesis)) {
      return null
    }

    let paddingCode = Tag._bitArray2number(bits.slice(6, 12))
    return new Tag(paddingCode, isGenesis)
  }

  /**
   * @return {number}
   */
  getPadding () {
    if (this._paddingCode === 0) {
      return 0
    }

    return Math.pow(2, this._paddingCode)
  }

  /**
   * @return {boolean}
   */
  isGenesis () {
    return this._isGenesis
  }

  /**
   * @return {number}
   */
  toSequence () {
    let bits = Array.prototype.concat(
      this._isGenesis ? Tag.genesisTagBits : Tag.xferTagBits,
      Tag._number2bitArray(this._paddingCode, 6),
      _.times(20).map(() => { return 0 })
    )

    return Tag._bitArray2number(bits)
  }
}

/**
 * @class EPOBCColorDefinition
 * @extends IColorDefinition
 */
class EPOBCColorDefinition extends IColorDefinition {
  /**
   * @constructor
   * @param {number} colorId
   * @param {Object} genesis
   * @param {string} genesis.txId
   * @param {number} genesis.outIndex
   * @param {number} genesis.height
   */
  constructor (colorId, genesis) {
    super(colorId)

    this._genesis = genesis
  }

  /**
   * @static
   * @return {string}
   */
  static getColorCode () {
    return 'epobc'
  }

  /**
   * @return {string}
   */
  getDesc () {
    let items = [
      'epobc',
      this._genesis.txId,
      this._genesis.outIndex,
      this._genesis.height
    ]
    return items.join(':')
  }

  /**
   * @static
   * @param {string} desc
   * @param {(number|ColorDefinitionManager)} resolver
   * @param {Object} [opts]
   * @param {boolean} [opts.autoAdd=true]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<?EPOBCColorDefinition>}
   */
  static async fromDesc (desc, resolver, opts) {
    let items = desc.split(':')
    if (items[0] !== 'epobc') {
      throw new errors.ColorDefinition.IncorrectDesc('EPOBC', desc)
    }

    if (_.isNumber(resolver)) {
      return new EPOBCColorDefinition(resolver, {
        txId: items[1],
        outIndex: parseInt(items[2], 10),
        height: parseInt(items[3], 10)
      })
    }

    let result = await resolver.resolve(desc, opts)
    if (result !== null) {
      result = result[0]
    }

    return result
  }

  /**
   * @static
   * @param {bitcore.Transaction} tx
   * @param {(number|ColorDefinitionManager)} resolver
   * @param {Object} [opts]
   * @param {boolean} [opts.autoAdd=true]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<?EPOBCColorDefinition>}
   */
  static async fromTx (tx, resolver, opts) {
    let tag = Tag.fromTx(tx)
    if (tag === null ||
        !tag.isGenesis() ||
        tx.outputs.length === 0 ||
        tx.outputs[0].satoshis - tag.getPadding() <= 0) {
      return null
    }

    if (_.isNumber(resolver)) {
      return new EPOBCColorDefinition(resolver, {
        txId: tx.id,
        outIndex: 0,
        height: 0
      })
    }

    let desc = ['epobc', tx.id, 0, 0].join(':')
    let result = await resolver.resolve(desc, opts)
    if (result !== null) {
      result = result[0]
    }

    return result
  }

  /**
   * @param {bitcore.Transaction} tx
   * @return {boolean}
   */
  isGenesis (tx) {
    return tx.id === this._genesis.txId
  }

  /**
   * Return an array of color value for every transaction output
   *
   * @param {bitcore.Transaction} tx
   * @param {Array.<?ColorValue>} inColorValues
   * @param {getTxFn} getTxFn
   * @return {Promise<Array.<?ColorValue>>}
   */
  async runKernel (tx, inColorValues, getTxFn) {
    let tag = Tag.fromTx(tx)
    if (tag === null || tag.isGenesis()) {
      let outColorValues = getArrayOfNull(tx.outputs.length)

      let isValidColorTx = tag !== null &&
                           this.isGenesis(tx) &&
                           tx.outputs.length > 0 &&
                           tx.outputs[0].satoshis - tag.getPadding() > 0

      if (isValidColorTx) {
        let value = tx.outputs[0].satoshis - tag.getPadding()
        outColorValues[0] = new ColorValue(this, value)
      }

      return outColorValues
    }

    let ftx = new FilledInputsTx(tx, getTxFn)
    await ftx.ready

    let padding = tag.getPadding()
    return await* tx.outputs.map(async (output, outIndex) => {
      let outValueWop = output.satoshis - padding
      if (outValueWop <= 0) {
        return null
      }

      let ainputs = await EPOBCColorDefinition._getXferAffectingInputs(
        ftx, padding, outIndex)

      let aiColorValue = new ColorValue(this, 0)

      let allColored = ainputs.every((ai) => {
        let isColored = inColorValues[ai] !== null
        if (isColored) {
          aiColorValue = aiColorValue.plus(inColorValues[ai])
        }

        return isColored
      })

      if (!allColored || aiColorValue.getValue() < outValueWop) {
        return null
      }

      return new ColorValue(this, outValueWop)
    })
  }

  /**
   * Returns a Array of indices that correspond to the inputs
   *  for an output in the transaction tx with output index outIndex
   *  which has a padding of padding (2^n for some n > 0 or 0)
   *
   * @static
   * @private
   * @param {FilledInputsTx} ftx
   * @param {number} padding
   * @param {number} outIndex
   * @return {Promise<number[]>}
   */
  static async _getXferAffectingInputs (ftx, padding, outIndex) {
    let tx = ftx.getTx()

    let outPrecSum = 0
    for (let oi = 0; oi < outIndex; ++oi) {
      let valueWop = tx.outputs[oi].satoshis - padding
      if (valueWop <= 0) {
        return []
      }

      outPrecSum += valueWop
    }

    let outValueWop = tx.outputs[outIndex].satoshis - padding
    if (outValueWop <= 0) {
      return []
    }

    let inputRunningSum = 0
    let ainputs = []

    for (let index = 0; index < tx.inputs.length; ++index) {
      let prevTx = await ftx.getInputTx(index)
      let prevValue = await ftx.getInputValue(index)

      let prevTag = Tag.fromTx(prevTx)
      if (prevTag === null) {
        break
      }

      let valueWop = prevValue - prevTag.getPadding()
      if (valueWop <= 0) {
        break
      }

      let isAffectingInput = inputRunningSum < (outPrecSum + outValueWop) &&
                             (inputRunningSum + valueWop) > outPrecSum

      if (isAffectingInput) {
        ainputs.push(index)
      }

      inputRunningSum += valueWop
    }

    return ainputs
  }

  /**
   * Return array of input indices
   *  for given tx and output indices given in outIndices
   *
   * @static
   * @param {bitcore.Transaction} tx
   * @param {number[]} outIndices
   * @param {getTxFn} getTxFn
   * @return {Promise<number[]>}
   */
  static async getAffectingInputs (tx, outIndices, getTxFn) {
    let tag = Tag.fromTx(tx)
    if (tag === null || tag.isGenesis()) {
      return []
    }

    let ftx = new FilledInputsTx(tx, getTxFn)
    await ftx.ready

    let padding = tag.getPadding()
    let aindices = await* outIndices.map((outIndex) => {
      return EPOBCColorDefinition._getXferAffectingInputs(
        ftx, padding, outIndex)
    })

    return _.uniq(_.flatten(aindices))
  }

  /**
   * @static
   * @param {OperationalTx} optx
   * @return {Promise<ComposedTx>}
   */
  static async makeComposedTx (optx) {
    let targetsByColor = ColorTarget.groupByColorId(optx.getTargets(),
                                                    EPOBCColorDefinition)

    let uncolored = ColorDefinitionManager.getUncolored()
    let uncoloredColorId = uncolored.getColorId()
    let uncoloredTargets = targetsByColor[uncoloredColorId] || []
    delete targetsByColor[uncoloredColorId]

    let uncoloredNeeded = uncoloredTargets.length === 0
                            ? new ColorValue(uncolored, 0)
                            : ColorTarget.sum(uncoloredTargets)

    let targetsColorIds = Object.keys(targetsByColor)
    let dustThreshold = optx.getDustThreshold().getValue()
    let coinsByColor = {}
    let minPadding = 0

    // get inputs, create change targets, compute min padding
    for (let targetColorId of targetsColorIds) {
      let targets = targetsByColor[targetColorId]
      let neededSum = ColorTarget.sum(targets)

      let selectedCoins = await optx.selectCoins(neededSum, null)
      coinsByColor[targetColorId] = _.invoke(selectedCoins.coins, 'toRawCoin')

      for (let target of targets) {
        let paddingNeeded = dustThreshold - target.getValue()
        minPadding = Math.min(minPadding, paddingNeeded)
      }

      let change = selectedCoins.total.minus(neededSum)
      if (change.getValue() > 0) {
        let cdef = change.getColorDefinition()
        let changeAddress = await optx.getChangeAddress(cdef)
        let changeScript = bitcore.Script.fromAddress(changeAddress)
        let changeTarget = new ColorTarget(changeScript.toHex(), change)
        targets.push(changeTarget)
      }
    }

    let comptx = optx.makeComposedTx()
    let tag = new Tag(Tag.closestPaddingCode(minPadding), false)

    // create inputs & outputs, compute uncolored requirements
    for (let targetColorId of targetsColorIds) {
      for (let coin of coinsByColor[targetColorId]) {
        let uncolored = ColorDefinitionManager.getUncolored()
        let coinValue = new ColorValue(uncolored, coin.value)
        uncoloredNeeded = uncoloredNeeded.minus(coinValue)
        comptx.addInput(coin)
      }

      for (let target of targetsByColor[targetColorId]) {
        let uncolored = ColorDefinitionManager.getUncolored()
        let targetValue = target.getValue() + tag.getPadding()
        let uncoloredValue = new ColorValue(uncolored, targetValue)
        uncoloredNeeded = uncoloredNeeded.plus(uncoloredValue)
        comptx.addOutput({script: target.getScript(), value: targetValue})
      }
    }

    comptx.addOutputs(uncoloredTargets.map((target) => {
      return {target: target}
    }))

    let fee = comptx.estimateRequiredFee()
    if (uncoloredNeeded.plus(fee).getValue() <= 0) {
      return uncoloredNeeded.plus(fee).neg()
    }

    let selectedCoins = await optx.selectCoins(uncoloredNeeded, comptx)
    comptx.addInputs(_.invoke(selectedCoins.coins, 'toRawCoin'))
    comptx.setInputSequence(0, tag.toSequence())

    fee = comptx.estimateRequiredFee()
    let uncoloredChange = selectedCoins.total.minus(uncoloredNeeded).minus(fee)
    if (uncoloredChange.getValue() > dustThreshold) {
      let uncolored = ColorDefinitionManager.getUncolored()
      let changeAddress = await optx.getChangeAddress(uncolored)
      comptx.addOutput({
        script: bitcore.Script.fromAddress(changeAddress).toHex(),
        value: uncoloredChange.getValue()
      })
    }

    return comptx
  }

  /**
   * @static
   * @param {OperationalTx} optx
   * @return {Promise<ComposedTx>}
   */
  static async composeGenesisTx (optx) {
    if (optx.getTargets().length !== 1) {
      throw new errors.Tx.Genesis.MultipleTarget(optx.getTargets().length)
    }

    let gtarget = optx.getTargets()[0]
    let genesisColorId = ColorDefinitionManager.getGenesis().getColorId()
    if (gtarget.getColorId() !== genesisColorId) {
      throw new errors.ColorDefinition.IncorrectColorId(gtarget.getColorId())
    }

    let paddingNeeded = optx.getDustThreshold().getValue() - gtarget.getValue()
    let tag = new Tag(Tag.closestPaddingCode(paddingNeeded), true)

    let uncolored = ColorDefinitionManager.getUncolored()
    let uncoloredValue = tag.getPadding() + gtarget.getValue()
    let uncoloredNeeded = new ColorValue(uncolored, uncoloredValue)

    let comptx = optx.makeComposedTx()
    comptx.addOutput({script: gtarget.getScript(), value: uncoloredValue})

    let selectedCoins = await optx.selectCoins(uncoloredNeeded, comptx)
    comptx.addInputs(_.invoke(selectedCoins.coins, 'toRawCoin'))
    comptx.setInputSequence(0, tag.toSequence())

    let fee = comptx.estimateRequiredFee()
    let uncoloredChange = selectedCoins.total.minus(uncoloredNeeded).minus(fee)
    if (uncoloredChange.getValue() > optx.getDustThreshold().getValue()) {
      let changeAddress = await optx.getChangeAddress(uncolored)
      comptx.addOutput({
        script: bitcore.Script.fromAddress(changeAddress).toHex(),
        value: uncoloredChange.getValue()
      })
    }

    return comptx
  }
}

ColorDefinitionManager.registerColorDefinitionClass(EPOBCColorDefinition)

EPOBCColorDefinition._Tag = Tag
export default EPOBCColorDefinition
