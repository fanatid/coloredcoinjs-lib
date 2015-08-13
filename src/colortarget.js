import _ from 'lodash'

import errors from './errors'
import ColorValue from './colorvalue'

/**
 * @class ColorTarget
 */
export default class ColorTarget {
  /**
   * @constructor
   * @param {string} script
   * @param {ColorValue} cvalue
   */
  constructor (script, cvalue) {
    this._script = script
    this._cvalue = cvalue
  }

  /**
   * @return {string}
   */
  getScript () {
    return this._script
  }

  /**
   * @return {ColorValue}
   */
  getColorValue () {
    return this._cvalue
  }

  /**
   * @return {number}
   */
  getValue () {
    return this._cvalue.getValue()
  }

  /**
   * @return {IColorDefinition}
   */
  getColorDefinition () {
    return this._cvalue.getColorDefinition()
  }

  /**
   * @return {number}
   */
  getColorId () {
    return this._cvalue.getColorId()
  }

  /**
   * @return {boolean}
   */
  isUncolored () {
    return this._cvalue.isUncolored()
  }

  /**
   * @param {Array.<ColorTarget>} targets
   * @return {ColorValue}
   * @throws {IncompatibilityError}
   */
  static sum (targets) {
    let colorValues = targets.map((target) => {
      return target.getColorValue()
    })

    return ColorValue.sum(colorValues)
  }

  /**
   * @typedef {Object} GroupedTargetsByColor
   * @property {ColorTarget[]} colorId1
   * @property {ColorTarget[]} colorIdN
   */

  /**
   * Group targets by color id or throw error
   *  if target is not uncolored or not instance of TargetCls
   *
   * @param {ColorTarget[]} targets
   * @param {function} TargetCls ColorDefinition constructor for filter targets
   * @return {GroupedTargetsByColor}
   * @throws {IncompatibilityError}
   */
  static groupByColorId (targets, TargetCls) {
    return _.groupBy(targets, (target) => {
      let isTargetCls = target.getColorDefinition() instanceof TargetCls
      if (!target.isUncolored() && !isTargetCls) {
        throw new errors.ColorDefinition.IncompatibilityError()
      }

      return target.getColorId()
    })
  }
}
