module.exports = {
  /** extended bitcoinjs-lib, errors, util and verify functions */
  bitcoin: require('./bitcoin'),
  errors: require('./errors'),
  util: require('./util'),
  verify: require('./verify'),

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
