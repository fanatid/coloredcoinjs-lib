module.exports = {
  /** extended bitcoinjs-lib, errors and util functions */
  bitcoin: require('./bitcoin'),
  errors: require('./errors'),
  util: require('./util'),

  /** Storage */
  SyncStorage: require('./SyncStorage'),

  /** Color Defintions */
  ColorDefinition: require('./ColorDefinition'),
  GenesisColorDefinition: require('./GenesisColorDefinition'),
  UncoloredColorDefinition: require('./UncoloredColorDefinition'),
  EPOBCColorDefinition: require('./EPOBCColorDefinition'),
  ColorDefinitionStorage: require('./ColorDefinitionStorage'),
  ColorDefinitionManager: require('./ColorDefinitionManager'),

  /** Color Data */
  ColorDataStorage: require('./ColorDataStorage'),
  ColorData: require('./ColorData'),

  /** Secondary */
  ColorSet: require('./ColorSet'),
  ColorValue: require('./ColorValue'),
  ColorTarget: require('./ColorTarget'),

  /** Transactions */
  OperationalTx: require('./OperationalTx'),
  SimpleOperationalTx: require('./SimpleOperationalTx'),
  ComposedTx: require('./ComposedTx')
}

Object.defineProperty(module.exports, 'verify', {
  configurable: false,
  enumerable: true,
  get: {
    console.warn('Will be removed from v1.0.0 beta!')
    return require('./verify')
  }
})
