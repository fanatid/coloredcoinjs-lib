var ColorDefinition = require('./ColorDefinition')


module.exports = {
  /* test-code */
  ColorDefinition: ColorDefinition,
  /* end-test-code */

  genesisOutputMarker: new ColorDefinition(-1),
  uncoloredMarker: new ColorDefinition(0),

  EPOBCColorDefinition: require('./EPOBCColorDefinition')
}
