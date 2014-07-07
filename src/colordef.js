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


var genesisOutputMarker = new ColorDefinition(-1)
var uncoloredMarker = new ColorDefinition(0)


/**
 * @class GenesisColorDefinition
 *
 * @param {number} colorID
 * @param {Object} genesis Contains txhash, outindex, height
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
   * @return {Tag|null} Tag instance if tx is genesis or xfer and not coinbase
   */
  function getTag(tx) {
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

  function getXferAffectingInputs() {}

  /**
   * @param {bitcoinjs-lib.Transaction} tx
   * @param {coloredcoinlib.blockchain.BlockchainState} bs
   * @param {function} cb Called on finished with params (error, bitcoinjs-lib.Transaction)
   */
  function ensureInputValues(tx, bs, cb) {
    tx = tx.clone()

    function processOne(index) {
      if (index === tx.ins.length) {
        cb(null, tx)
        return
      }

      var isCoinbase = (
        tx.ins[index].hash.toString('hex') === '0000000000000000000000000000000000000000000000000000000000000000' &&
        tx.ins[index].index === 4294967295)

      if (isCoinbase) {
        tx.ins[index].value = 0
        process.nextTick(function() { processOne(index+1) })

      } else {
        bs.getTx(tx.ins[index].hash.toString('hex'), function(error, prevTx) {
          if (error === null) {
            tx.ins[index].prevTx = prevTx
            tx.ins[index].value = prevTx.outs[tx.ins[index].index].value
            process.nextTick(function() { processOne(index+1) })

          } else {
            cb(error, null)
          }
        })
      }
    }

    process.nextTick(function() { processOne(0) })
  }


  /**
   * @class EPOBCColorDefinition
   */
  function EPOBCColorDefinition() {
    GenesisColorDefinition.call(this, Array.prototype.slice.call(arguments))
  }

  inherits(EPOBCColorDefinition, GenesisColorDefinition)

  EPOBCColorDefinition.prototype.runKernel = function() {

  }

  /**
   * @param {bitcoinjs-lib.Transaction} tx
   * @param {Array} outputSet
   * @param {coloredcoinlib.blockchain.BlockchainState} bs
   * @param {function} cb Called on finished with params (error, Array)
   */
  EPOBCColorDefinition.prototype.getAffectingInputs = function(tx, outputSet, bs, cb) {
    var tag = getTag(tx)

    if (tag === null || tag.isGenesis) {
      cb(null, [])

    } else {
      ensureInputValues(tx, bs, function(error, tx) {
        if (error !== null) {
          cb(error, [])
          return
        }

        cb(null, [])
      })
    }
  }

  return EPOBCColorDefinition
})();


module.exports = {
  ColorDefinition: ColorDefinition,
  EPOBCColorDefinition: EPOBCColorDefinition,

  genesisOutputMarker: genesisOutputMarker,
  uncoloredMarker: uncoloredMarker
}
