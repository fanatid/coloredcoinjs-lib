let cclib = {}

// version
cclib.version = require('../package.json').version

// library errors
cclib.errors = require('./errors')

//
cclib.ColorData = require('./colordata')
cclib.ColorSet = require('./colorset')
cclib.ColorTarget = require('./colortarget')
cclib.ColorValue = require('./colorvalue')

// color definitions
cclib.definitions = {}
cclib.definitions.Manager = require('./definitions/manager')
cclib.definitions.Interface = require('./definitions/interface')
cclib.definitions.Uncolored = require('./definitions/uncolored')
cclib.definitions.Genesis = require('./definitions/genesis')
cclib.definitions.EPOBC = require('./definitions/epobc')

// storage (data and definitions)
cclib.storage = {}
cclib.storage.data = require('./storage/data')
cclib.storage.definitions = require('./storage/definitions')

// tx
cclib.tx = {}
cclib.tx.FilledInputs = require('./tx/filledinputs')
cclib.tx.Composed = require('./tx/composed')
cclib.tx.Operational = require('./tx/operational')
cclib.tx.SimpleOperational = require('./tx/simpleoperational')

// util
cclib.util = {}
cclib.util.bitcoin = require('./util/bitcoin')
cclib.util.const = require('./util/const')

export default cclib
