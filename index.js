'use strict'

var cclib = module.exports

// version
cclib.version = require('./package.json').version

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
cclib.storage.data = require('./lib/storage/data')
cclib.storage.definitions = require('./lib/storage/definitions')

// tx
cclib.tx = {}
cclib.tx.FilledInputsTx = require('./lib/tx/filledinputs')
cclib.tx.ComposedTx = require('./lib/tx/composed')
cclib.tx.OperationalTx = require('./lib/tx/operational')
cclib.tx.SimpleOperationalTx = require('./lib/tx/simpleoperational')

// util
cclib.util = {}
cclib.util.const = require('./lib/util/const')
cclib.util.js = require('./lib/util/js')
cclib.util.tx = require('./lib/util/tx')
