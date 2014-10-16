module.exports = {
  /** extended bitcoinjs-lib */
  bitcoin: require('./bitcoin'),

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
  ComposedTx: require('./ComposedTx')
}
