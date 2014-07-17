var assert = require('assert')
var _ = require('underscore')
var inherits = require('inherits')

var blockchain = require('./blockchain')
var colorvalue = require('./colorvalue')
var Transaction = require('./transaction')


/**
 * Represents a color definition scheme. This means how color exists and
 *  is transferred in the blockchain
 *
 * @class ColorDefinition
 *
 * @param {number} colorId
 */
function ColorDefinition(colorId) {
  assert(_.isNumber(colorId), 'Expected number colorId, got ' + colorId)

  this.colorId = colorId
}

/**
 * @return {number}
 */
ColorDefinition.prototype.getColorId = function() {
  return this.colorId
}


/**
 * @class GenesisColorDefinition
 *
 * Inherits ColorDefinition
 *
 * @param {number} colorId
 * @param genesis
 * @param genesis.txId transaction id
 * @param genesis.outIndex number
 * @param genesis.height number
 */
function GenesisColorDefinition(colorId, genesis) {
  ColorDefinition.call(this, colorId)

  assert(_.isObject(genesis), 'Expected object genesis, got ' + genesis)
  assert(Transaction.isTxId(genesis.txId), 'Expected transaction id txId, got ' + genesis.txId)
  assert(_.isNumber(genesis.outIndex), 'Expected number outIndex, got ' + genesis.outIndex)
  assert(_.isNumber(genesis.height), 'Expected number height, got ' + genesis.height)

  this.genesis = genesis
}

inherits(GenesisColorDefinition, ColorDefinition)

/**
 * @param {Transaction} tx
 * @return {boolean}
 */
GenesisColorDefinition.prototype.isSpecialTx = function(tx) {
  assert(tx instanceof Transaction, 'Expected Transaction tx, got ' + tx)

  var isSpecialTx = tx.getId() === this.genesis.txId

  return isSpecialTx
}


var EPOBCColorDefinition = (function() {
  var xferTagBits = [1, 1, 0, 0, 1, 1]
  var genesisTagBits = [1, 0, 1, 0, 0, 1]

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
   * @param {number} n sequence in transaction, 4 bytes unsigned int
   * @return {Array} array bits of n
   */
  function number2bitArray(n) {
    assert(_.isNumber(n), 'Expected number n, got ' + n)
    assert(0 <= n <= 4294967295, 'Expected 0 <= n <= 4294967295, got ' + n)

    var bits = []
    for (var i = 0; i < 32; ++i)
      bits.push(1 & (n >> i))
    return bits
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
   * @param {Transaction} tx
   * @return {Tag|null} Tag instance if tx is genesis or xfer and not coinbase
   */
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

    var isXfer = tagBits.every(function(v, i) { return v === xferTagBits[i] })
    var isGenesis = tagBits.every(function(v, i) { return v === genesisTagBits[i] })

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
   * Inherits GenesisColorDefinition
   *
   * @param {number} colorId
   * @param genesis
   * @param genesis.txId transaction id
   * @param genesis.outIndex number
   * @param genesis.height number
   */
  function EPOBCColorDefinition() {
    GenesisColorDefinition.apply(this, Array.prototype.slice.call(arguments))
  }

  inherits(EPOBCColorDefinition, GenesisColorDefinition)


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
    assert(colorValueSet.every(function(cv) { return (cv === null || cv instanceof colorvalue.ColorValue) }),
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
          outColorValues[0] = new colorvalue.SimpleColorValue({ colordef: this, value: valueWop })
      }

      cb(null, outColorValues)
      return
    }

    bs.ensureInputValues(tx, function(error, tx) {
      if (error !== null) {
        cb(error)
        return
      }

      var padding = tag.getPadding()

      for (var outIndex = 0; outIndex < tx.outs.length; ++outIndex) {
        var outValueWop = tx.outs[outIndex].value - padding

        if (outValueWop <= 0) {
          outColorValues.push(null)
          continue
        }

        var allColored = true
        var aiColorValue = new colorvalue.SimpleColorValue({ colordef: _this, value: 0 })

        /* jshint ignore:start */
        getXferAffectingInputs(tx, padding, outIndex).forEach(function(ai) {
          if (colorValueSet[ai] === null || _.isUndefined(colorValueSet[ai])) // Todo: need check undefined?
            allColored = false
          else
            aiColorValue.add(colorValueSet[ai])
        })
        /* jshint ignore:end */

        if (allColored && aiColorValue.getValue() >= outValueWop)
          outColorValues.push(new colorvalue.SimpleColorValue({ colordef: _this, value: outValueWop }))
        else
          outColorValues.push(null)
      }

      cb(null, outColorValues)
    })
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
      bs.ensureInputValues(tx, function(error, tx) {
        if (error === null) {
          var aii = []
          outputSet.forEach(function(outIndex) {
            getXferAffectingInputs(tx, tag.getPadding(), outIndex).forEach(function(ai) {
              if (aii.indexOf(ai) === -1)
                aii.push(ai)
            })
          })

          var inputs = []
          aii.forEach(function(ii) { inputs.push(tx.ins[ii]) })

          cb(null, inputs)

        } else {
          cb(error, null)
        }
      })
    }
  }

  /* test-code */
  EPOBCColorDefinition.Tag = Tag
  EPOBCColorDefinition.Tag.number2bitArray = number2bitArray
  EPOBCColorDefinition.Tag.bitArray2number = bitArray2number
  EPOBCColorDefinition.Tag.getTag = getTag
  EPOBCColorDefinition.getXferAffectingInputs = getXferAffectingInputs
  /* end-test-code */

  return EPOBCColorDefinition
})()


module.exports = {
  /* test-code */
  GenesisColorDefinition: GenesisColorDefinition,
  /* end-test-code */

  ColorDefinition: ColorDefinition,
  EPOBCColorDefinition: EPOBCColorDefinition,

  genesisOutputMarker: new ColorDefinition(-1),
  uncoloredMarker: new ColorDefinition(0)
}
