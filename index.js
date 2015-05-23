var cclib = module.exports

//
cclib.ColorData = require('./lib/colordata')
cclib.ColorSet = require('./lib/colorset')
cclib.ColorTarget = require('./lib/colortarget')
cclib.ColorValue = require('./lib/colorvalue')

cclib.errors = require('./lib/errors')

// color definitions
cclib.definitions = {}
cclib.definitions.Manager = require('./lib/definitions/manager')
cclib.definitions.Interface = require('./lib/definitions/interface')
cclib.definitions.Uncolored = require('./lib/definitions/uncolored')
cclib.definitions.Genesis = require('./lib/definitions/genesis')
cclib.definitions.EPOBC = require('./lib/definitions/epobc')

// storage (data and definitions)
cclib.storage = {}
cclib.storage._providers = require('./lib/storage/providers')
cclib.storage.data = require('./lib/storage/data')
cclib.storage.definitions = require('./lib/storage/definitions')

// tx
cclib.tx = {}
cclib.tx.Composed = require('./lib/tx/composed')
cclib.tx.Operational = require('./lib/tx/operational')
cclib.tx.SimpleOperational = require('./lib/tx/simpleoperational')

// util
cclib.util = {}
cclib.util.bitcoin = require('./lib/util/bitcoin')

// dependencies
cclib.deps = {}
cclib.deps.bitcore = require('bitcore')
cclib.deps.Promise = require('bluebird')
cclib.deps._ = require('lodash')
