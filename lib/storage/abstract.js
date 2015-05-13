/* globals Promise:true */
var Promise = require('bluebird')

/**
 * @class AbstractStorage
 */
function AbstractStorage () {
  if (!(this instanceof AbstractStorage)) {
    return new AbstractStorage()
  }

  var self = this
  /* @todo Use bitcore.util.defineImmutable */
  Object.defineProperty(self, 'ready', {
    configurable: true,
    enumerable: true,
    writable: false,
    value: new Promise(function (resolve, reject) {
      self._readyResolve = resolve
      self._readyReject = reject
    })
  })
}

/**
 * @private
 * @param {Error} [err]
 */
AbstractStorage.prototype._setReady = function _setReady (err) {
  if (err) {
    return this._readyReject(err)
  }

  this._readyResolve()
}

/**
 * @return {boolean}
 */
AbstractStorage.prototype.isReady = function isReady () {
  return this.ready.isFulfilled()
}

/**
 * @return {boolean}
 */
AbstractStorage.isAvailable = function isAvailable () { return false }

module.exports = AbstractStorage
