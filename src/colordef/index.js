var ColorDefinition = require('./ColorDefinition')


module.exports = {
  /* test-code */
  ColorDefinition: ColorDefinition,
  /* end-test-code */

  genesisOutputMarker: new ColorDefinition({ colorId: -1 }),
  uncoloredMarker: new ColorDefinition({ colorId: 0 }),

  EPOBCColorDefinition: require('./EPOBCColorDefinition')
}
