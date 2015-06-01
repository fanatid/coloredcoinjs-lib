var cclib = module.exports

// library errors
cclib.errors = require('./lib/errors')

//
cclib.ColorData = require('./lib/colordata')
cclib.ColorSet = require('./lib/colorset')
cclib.ColorTarget = require('./lib/colortarget')
cclib.ColorValue = require('./lib/colorvalue')

// color definitions
cclib.definitions = {}
cclib.definitions.Manager = require('./lib/definitions/manager')
cclib.definitions.Interface = require('./lib/definitions/interface')
cclib.definitions.Uncolored = require('./lib/definitions/uncolored')
cclib.definitions.Genesis = require('./lib/definitions/genesis')
cclib.definitions.EPOBC = require('./lib/definitions/epobc')

// storage (data and definitions)
cclib.storage = {}
cclib.storage.providers = require('./lib/storage/providers')
cclib.storage.data = require('./lib/storage/data')
cclib.storage.definitions = require('./lib/storage/definitions')

// tx
cclib.tx = {}
cclib.tx.FilledInputs = require('./lib/tx/filledinputs')
cclib.tx.Composed = require('./lib/tx/composed')
cclib.tx.Operational = require('./lib/tx/operational')
cclib.tx.SimpleOperational = require('./lib/tx/simpleoperational')

// util
cclib.util = {}
cclib.util.bitcoin = require('./lib/util/bitcoin')
cclib.util.transactions = require('./lib/util/transactions')

// dependencies
cclib.deps = {}
cclib.deps.bitcore = require('bitcore')
cclib.deps.bluebird = require('bluebird')
cclib.deps.bs58 = require('bs58')
cclib.deps.errorSystem = require('error-system')
cclib.deps.lodash = require('lodash')
cclib.deps.makeConcurrent = require('make-concurrent')
cclib.deps.readyMixin = require('ready-mixin')
