import _ from 'lodash'
import bitcore from 'bitcore'

import IColorDefinition from './interface'
import ColorTarget from '../colortarget'
import errors from '../errors'

const UncoloredColorId = 0

/**
 * @class UncoloredColorDefinition
 * @extends IColorDefinition
 */
export default class UncoloredColorDefinition extends IColorDefinition {
  /**
   * @constructor
   */
  constructor () {
    super(UncoloredColorId)
  }

  /**
   * @static
   * @return {string}
   */
  static getColorCode () {
    return 'uncolored'
  }

  /**
   * @return {string}
   */
  getDesc () {
    return ''
  }

  /**
   * @static
   * @param {string} desc
   * @param {(number|ColorDefinitionManager)} resolver
   * @param {Object} [opts]
   * @param {boolean} [opts.autoAdd=true]
   * @param {Object} [opts.executeOpts]
   * @return {Promise.<UncoloredColorDefinition>}
   */
  static async fromDesc (desc, resolver) {
    if (desc !== '') {
      throw new errors.ColorDefinition.IncorrectDesc('Uncolored', desc)
    }

    if (_.isNumber(resolver) && resolver !== UncoloredColorId) {
      throw new errors.ColorDefinition.IncorrectColorId('Uncolored', resolver)
    }

    return new UncoloredColorDefinition()
  }

  /**
   * @static
   * @param {OperationalTx} optx
   * @return {Promise.<ComposedTx>}
   */
  static async makeComposedTx (optx) {
    let targets = optx.getTargets()
    let targetsTotalValue = ColorTarget.sum(targets)

    let comptx = optx.makeComposedTx()
    comptx.addOutputs(targets.map((target) => { return {target: target} }))

    let selectedCoins = await optx.selectCoins(targetsTotalValue, comptx)
    comptx.addInputs(_.invoke(selectedCoins.coins, 'toRawCoin'))

    let fee = comptx.estimateRequiredFee()
    let change = selectedCoins.total.minus(targetsTotalValue).minus(fee)

    if (change.getValue() > optx.getDustThreshold().getValue()) {
      let uncolored = new UncoloredColorDefinition()
      let changeAddress = await optx.getChangeAddress(uncolored)
      comptx.addOutput({
        script: bitcore.Script.fromAddress(changeAddress).toHex(),
        value: change.getValue()
      })
    }

    return comptx
  }
}
