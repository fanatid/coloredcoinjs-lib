/* globals Promise:true */
var _ = require('lodash')
var inherits = require('util').inherits

var LocalStorageProvider = require('../providers/localstorage')
var ColorDefinitionSyncStorage = require('./sync')

/**
 * @class ColorDefinitionLocalStorage
 * @extends ColorDefinitionSyncStorage
 * @param {string} prefix
 */
function ColorDefinitionLocalStorage (prefix) {
  if (!(this instanceof ColorDefinitionLocalStorage)) {
    return new ColorDefinitionLocalStorage(prefix)
  }

  var storage = new LocalStorageProvider(prefix)
  ColorDefinitionSyncStorage.call(this, storage)
}

inherits(ColorDefinitionLocalStorage, ColorDefinitionSyncStorage)

/**
 * @return {boolean}
 */
ColorDefinitionLocalStorage.isAvailable = function isAvailable () {
  try {
    return 'localStorage' in window && _.isObject(window.localStorage)
  } catch (err) {
    return false
  }
}

module.exports = ColorDefinitionLocalStorage
