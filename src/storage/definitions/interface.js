import { mixin } from 'core-decorators'
import ReadyMixin from 'ready-mixin'

import { NotImplemented } from '../../errors'

/**
 * @typedef {Object} IColorDefinitionStorage~Record
 * @property {number} id
 * @property {string} desc
 */

/**
 * @class IColorDefinitionStorage
 * @mixes ReadyMixin
 */
@mixin(ReadyMixin)
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
   * @param {Object} [opts.executeOpts]
   * @return {Promise<{record: ?IColorDefinitionStorage~Record, new: ?boolean}>}
   */
  async resolve () {
    throw new NotImplemented(`${this.constructor.name}.resolve`)
  }

  /**
   * @param {Object} data
   * @param {number} [data.id]
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<(
   *   ?IColorDefinitionStorage~Record|
   *   IColorDefinitionStorage~Record[]
   * )>}
   */
  async get () {
    throw new NotImplemented(`${this.constructor.name}.get`)
  }

  /**
   * @param {Object} data
   * @param {number} data.id
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async remove (data, opts) {
    throw new NotImplemented(`${this.constructor.name}.remove`)
  }

  /**
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async clear () {
    throw new NotImplemented(`${this.constructor.name}.clear`)
  }
}
