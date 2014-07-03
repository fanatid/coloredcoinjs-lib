var http = require('http')
var inherits = require('inherits')


/**
 * BlockchainState that uses [Blockchain Data API]{@link https://blockchain.info/api/blockchain_api}
 *
 * @class BlockchaininfoDataAPI
 */
function BlockchaininfoDataAPI() {}

/**
 * Make request to the server
 *
 * @param {string} path Path to resource
 * @param {function} cb Function executed with params (error, response)
 */
BlockchaininfoDataAPI.prototype.request = function(path, cb) {
  if (path.indexOf('cors=true') === -1)
    path += (path.indexOf('?') === -1 ? '?' : '&') + 'cors=true'

  var opts = {
    path: path,
    host: 'blockchain.info',
    port: 80
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
BlockchaininfoDataAPI.prototype.getBlockCount = function(cb) {
  this.request('/latestblock', function(error, response) {
    if (error === null) {
      try {
        response = JSON.parse(response).height
        if (response === undefined)
          throw 'height not found in response'
      } catch (e) {
        error = e
        response = null
      }
    }

    cb(error, response)
  })
}


module.exports = {
  BlockchaininfoDataAPI: BlockchaininfoDataAPI
}
