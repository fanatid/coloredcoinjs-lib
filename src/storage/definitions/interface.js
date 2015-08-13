import initReadyMixin from 'ready-mixin'

import errors from '../../errors'

/**
 * @typedef {Object} IColorDefinitionStorage~Record
 * @property {number} id
 * @property {string} desc
 */

/**
 * @class IColorDefinitionStorage
 * @mixes ReadyMixin
 */
export default class IColorDefinitionStorage {
  /**
   * @static
   * @return {boolean}
   */
  static isAvailable () { return false }

  /**
   * @param {string} desc
   * @param {Object} [opts]
   * @param {boolean} [opts.autoAdd=true]
   * @return {Promise.<{record: ?IColorDefinitionStorage~Record, new: ?boolean}>}
   */
  async resolve () {
    throw new errors.NotImplemented(this.constructor.name + '.resolve')
  }

  /**
   * @param {Object} [opts]
   * @param {number} [opts.id]
   * @return {Promise.<(
   *   ?IColorDefinitionStorage~Record|
   *   IColorDefinitionStorage~Record[]
   * )>}
   */
  async get () {
    throw new errors.NotImplemented(this.constructor.name + '.get')
  }

  /**
   * @return {Promise}
   */
  async clear () {
    throw new errors.NotImplemented(this.constructor.name + '.clear')
  }
}

let ReadyMixin = initReadyMixin(Promise)
ReadyMixin(IColorDefinitionStorage.prototype)
