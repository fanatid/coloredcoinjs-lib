import { mixin } from 'core-decorators'
import ReadyMixin from 'ready-mixin'

import { NotImplemented } from '../../errors'

/**
 * @typedef {Object} IDataStorage~Record
 * @property {string} colorCode
 * @property {string} txId
 * @property {number} outIndex
 * @property {number} colorId
 * @property {*} value
 */

/**
 * @class IDataStorage
 * @mixes ReadyMixin
 */
@mixin(ReadyMixin)
export default class IDataStorage {
  /**
   * @static
   * @return {boolean}
   */
  static isAvailable () { return false }

  /**
   * @param {IDataStorage~Record} data
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async add () {
    throw new NotImplemented(`${this.constructor.name}.add`)
  }

  /**
   * @param {Object} data
   * @param {string} data.colorCode
   * @param {string} data.txId
   * @param {number} [data.outIndex]
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<Map<number, Map<number, *>>>}
   */
  async get () {
    throw new NotImplemented(`${this.constructor.name}.get`)
  }

  /**
   * @param {Object} data
   * @param {string} [data.colorCode]
   * @param {string} [data.txId]
   * @param {number} [data.colorId]
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async remove () {
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
