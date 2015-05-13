/* globals Promise:true */
var Promise = require('bluebird')

/**
 * @class AbstractStorage
 */
function AbstractStorage () {
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
AbstractStorage.prototype._setReady = function (err) {
  if (err) {
    return this._readyReject(err)
  }

  this._readyResolve()
}

/**
 * @return {boolean}
 */
AbstractStorage.prototype.isReady = function () {
  return this.ready.isFulfilled()
}

module.exports = AbstractStorage
