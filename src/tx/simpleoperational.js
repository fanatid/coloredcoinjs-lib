import _ from 'lodash'

import OperationalTx from './operational'
import ColorValue from '../colorvalue'
import UncoloredColorDefinition from '../definitions/uncolored'
import errors from '../errors'

/**
 * @class SimpleOperationalTx
 * @extends OperationalTx
 */
export default class SimpleOperationalTx extends OperationalTx {
  /**
   * @constructor
   * @param {Object} data
   * @param {ColorTarget[]} data.targets
   * @param {Object} data.coins
   * @param {OperationalTx~AbstractRawCoin[]} data.coins.colorIdN
   * @param {Object} data.changeAddresses
   * @param {string} data.changeAddresses.colorIdN
   * @param {number} [data.fee] If omitted than fee will be calcaultaed automatically
   */
  constructor (data) {
    super()

    this._data = data
    this.addTargets(data.targets)
  }

  /**
   * @param {ColorValue} cvalue
   * @param {FeeEstimator} [feeEstimator]
   * @return {Promise.<OperationalTx~selectCoinsResult>}
   */
  async selectCoins (colorValue, feeEstimator = null) {
    if (feeEstimator !== null && !colorValue.isUncolored()) {
      throw new errors.Tx.Operational.FeeEstimator(
        'feeEstimator can only be used with uncolored coins')
    }

    let coins = []
    let totalValue = 0

    for (let coin of this._data.coins[colorValue.getColorId()]) {
      coins.push({toRawCoin: () => { return _.cloneDeep(coin) }})
      totalValue += coin.value

      let neededValue = colorValue.getValue()
      if (feeEstimator !== null) {
        let fee = feeEstimator.estimateRequiredFee({inputs: coins.length})
        neededValue += fee.getValue()
      }

      if (totalValue >= neededValue) {
        break
      }
    }

    return {
      coins: coins,
      total: new ColorValue(colorValue.getColorDefinition(), totalValue)
    }
  }

  /**
   * @param {IColorDefinition} cdef
   * @return {Promise.<string>}
   */
  getChangeAddress (cdef) {
    return Promise.resolve(this._data.changeAddresses[cdef.getColorId()])
  }

  /**
   * @param {number} txSize Transaction size in bytes
   * @param {number} [feePerKb=10000] Satoshis-per-kilobyte
   * @return {ColorValue}
   */
  getRequiredFee (...args) {
    if (this._data.fee === undefined) {
      super.getRequiredFee(...args)
    }

    return new ColorValue(new UncoloredColorDefinition(), this._data.fee)
  }
}
