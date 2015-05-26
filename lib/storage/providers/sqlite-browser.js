/* globals Promise:true */
var Promise = require('bluebird')
var readyMixin = require('ready-mixin')(Promise)

/**
 * @class StubStubSQLiteProvider
 */
function StubStubSQLiteProvider () {}

readyMixin(StubStubSQLiteProvider.prototype)

/**
 * @return {boolean}
 */
StubStubSQLiteProvider.isAvailable = function () { return false }

/**
 */
StubStubSQLiteProvider.prototype.open = function () {}

module.exports = StubStubSQLiteProvider
