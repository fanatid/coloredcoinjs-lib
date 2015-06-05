/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)

var _ = require('lodash')
var base58 = require('bs58')
var crypto = require('crypto')

/**
 * @class ColorSet
 * @param {definitions.Manager} cdmanager
 * @param {string[]} cdescs
 */
function ColorSet (cdmanager, cdescs) {
  var self = this
  self._cdescs = cdescs

  Promise.map(self._cdescs, function (cdesc) {
    return cdmanager.resolve(cdesc, {autoAdd: true})
  })
  .then(function (cdefs) {
    self._cdefs = cdefs
  })
  .done(function () { self._ready() },
        function (err) { self._ready(err) })
}

readyMixin(ColorSet.prototype)

/**
 * Return a hex string that represent current ColorSet
 * @return {string}
 */
ColorSet.prototype.getColorHash = function () {
  var cdescs = _.sortBy(this._cdescs)
  // for compact replace ', ' to ',' as in ngcccbase
  var data = JSON.stringify(cdescs).replace(', ', ',')
  var chash = crypto.createHash('sha256').update(data).digest().slice(0, 10)
  return base58.encode(chash)
}

/**
 * @return {string[]}
 */
ColorSet.prototype.getColorDescs = function () {
  return this._cdescs.slice(0)
}

/**
 * @return {Promise.<ColorDefinition[]>}
 */
ColorSet.prototype.getColorDefinitions = function () {
  var self = this
  return self.ready
    .then(function () { return self._cdefs.slice(0) })
}

/**
 * @return {Promise.<number[]>}
 */
ColorSet.prototype.getColorIds = function () {
  var self = this
  return self.ready
    .then(function () { return _.invoke(self._cdefs, 'getColorId') })
}

module.exports = ColorSet
