var http = require('http')
var inherits = require('inherits')


/**
 * Parent class for BlockchainState that uses
 *   [blockexplorer.com]{@link BlockexplorerBlockchainState} and
 *   [blockchain.info]{@link BlockchaininfoBlockchainState} as sources
 *
 * @class SimpleQueryAPI
 */
function SimpleQueryAPI() {
  this.port = 80
}

/**
 * Make request to the server
 *
 * @param {string} path Path to resource
 * @param {function} cb Function executed with params (error, response)
 */
SimpleQueryAPI.prototype.request = function(path, cb) {
  var opts = {
    path: '/q/' + path,
    host: this.host,
    port: this.port
  }

  http.get(opts, function(res) {
    var buf = ''

    res.on('data', function(data) {
      buf += data
    })

    res.on('end', function() {
      cb(null, buf)
    })

    res.on('error', function(error) {
      cb(error, null)
    })
  })
}

/**
 * Get block count in blockchain
 *
 * @param {function} cb Function executed with params (error, response)
 */
SimpleQueryAPI.prototype.getBlockCount = function(cb) {
  this.request('getblockcount', function(error, response) {
    if (error !== null) {
      try {
        response = parseInt(response)
      } catch (e) {
        error = e
        response = null
      }
    }

    cb(error, response)
  })
}


/**
 * BlockchainState for [blockchain.info]{@link http://blockchain.info/},
 *  inherits {@link SimpleQueryAPI}
 *
 * @class BlockchaininfoBlockchainState
 */
function BlockchaininfoBlockchainState() {
  SimpleQueryAPI.call(this)
  this.host = 'blockchain.info'
}

inherits(BlockchaininfoBlockchainState, SimpleQueryAPI)


/**
 * BlockchainState for [blockexplorer.com]{@link http://blockexplorer.com/},
 *  inherits {@link SimpleQueryAPI}
 *
 * @class BlockexplorerBlockchainState
 */
function BlockexplorerBlockchainState() {
  SimpleQueryAPI.call(this)
  this.host = 'blockexplorer.com'
}

inherits(BlockexplorerBlockchainState, SimpleQueryAPI)


module.exports = {
  BlockchaininfoBlockchainState: BlockchaininfoBlockchainState,
  BlockexplorerBlockchainState: BlockexplorerBlockchainState
}
