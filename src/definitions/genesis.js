import IColorDefinition from './interface'

const GenesisColorId = -1
/**
 * @class GenesisColorDefinition
 * @extends IColorDefinition
 */
export default class GenesisColorDefinition extends IColorDefinition {
  /**
   * @constructor
   */
  constructor () {
    super(GenesisColorId)
  }
}
