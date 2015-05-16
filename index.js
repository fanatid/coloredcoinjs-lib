var cclib = module.exports

// storage (data and definitions)
cclib.storage = {}
cclib.storage._AbstractStorage = require('./lib/storage/abstract')
cclib.storage._providers = require('./lib/storage/providers')
cclib.storage.data = require('./lib/storage/data')
cclib.storage.definitions = require('./lib/storage/definitions')

/* @todo Make like upper */
require('lodash').extend(cclib, {
  /** extended bitcoinjs-lib, errors and util functions */
  bitcoin: require('./lib/bitcoin'),
  errors: require('./lib/errors'),
  util: require('./lib/util'),

  /** Storage */
  SyncStorage: require('./lib/SyncStorage'),

  /** Color Defintions */
  ColorDefinition: require('./lib/ColorDefinition'),
  GenesisColorDefinition: require('./lib/GenesisColorDefinition'),
  UncoloredColorDefinition: require('./lib/UncoloredColorDefinition'),
  EPOBCColorDefinition: require('./lib/EPOBCColorDefinition'),
  ColorDefinitionStorage: require('./lib/ColorDefinitionStorage'),
  ColorDefinitionManager: require('./lib/ColorDefinitionManager'),

  /** Color Data */
  ColorDataStorage: require('./lib/ColorDataStorage'),
  ColorData: require('./lib/ColorData'),

  /** Secondary */
  ColorSet: require('./lib/ColorSet'),
  ColorValue: require('./lib/ColorValue'),
  ColorTarget: require('./lib/ColorTarget'),

  /** Transactions */
  OperationalTx: require('./lib/OperationalTx'),
  SimpleOperationalTx: require('./lib/SimpleOperationalTx'),
  ComposedTx: require('./lib/ComposedTx')
})

Object.defineProperty(module.exports, 'verify', {
  configurable: false,
  enumerable: true,
  get: function () {
    console.warning('Verify will be removed from v1.0.0 beta!')
    return require('./lib/verify')
  }
})
