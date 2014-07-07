var inherits = require('inherits')

/**
 * Represents a color definition scheme. This means how color exists and
 *  is transferred in the blockchain
 *
 * @class ColorDefinition
 */
function ColorDefinition(colorID) {
  this.colorID = colorID
}


var GENESIS_OUTPUT_MARKER = ColorDefinition(-1)
var UNCOLORED_MARKER = ColorDefinition(0)


/**
 * @class GenesisColorDefinition
 */
function GenesisColorDefinition(colorID, genesis) {
  ColorDefinition.apply(this, colorID)
  this.genesis = genesis
}

inherits(GenesisColorDefinition, ColorDefinition)


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
    console.assert(0 <= n <= 4294967295)

    var bits = []
    for (var i = 0; i < 32; i++)
      bits.push(1 & (n >> i))
    return bits
  }

  /**
   * @param {Array} bits
   * @return {number}
   */
  function bitArray2number(bits) {
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
   * @param {bitcoinjs-lib.Transaction} tx
   * @return {Tag|null} Tag instance if tx is genesis or xfer
   */
  function getTag(tx) {
    // Todo: add check (tx.raw.vin[0].prevout.is_null())
    //if (?)
    //  return null

    var nSequence = tx.ins[0].sequence
    var bits = number2bitArray(nSequence)
    var tagBits = bits.slice(0, 6)

    if (tagBits.some(function(v, i) { return v !== xferTagBits[i] }) &&
        tagBits.some(function(v, i) { return v !== genesisTagBits[i] }))
      return null

    var paddingCode = bitArray2number(bits.slice(6, 12))
    var isGenesis = tagBits.every(function(v, i) { return v === genesisTagBits[i] })
    return new Tag(paddingCode, isGenesis)
  }


  /**
   * @class EPOBCColorDefinition
   */
  function EPOBCColorDefinition() {
    GenesisColorDefinition.apply(this, Array.prototype.slice.call(arguments, 0))
  }

  inherits(EPOBCColorDefinition, GenesisColorDefinition)

  EPOBCColorDefinition.prototype.runKernel = function() {

  }

  EPOBCColorDefinition.prototype.getAffectingInputs = function() {

  }

  function getXferAffectingInputs() {

  }

  return EPOBCColorDefinition
})();


module.exports = {
  ColorDefinition: ColorDefinition,
  EPOBCColorDefinition: EPOBCColorDefinition,

  GENESIS_OUTPUT_MARKER: GENESIS_OUTPUT_MARKER,
  UNCOLORED_MARKER: UNCOLORED_MARKER
}
