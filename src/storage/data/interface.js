import readyMixin from 'ready-mixin'

import errors from '../../errors'

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
    throw new errors.NotImplemented(this.constructor.name + '.add')
  }

  /**
   * @param {Object} data
   * @param {string} data.colorCode
   * @param {string} data.txId
   * @param {number} [data.outIndex]
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise.<Map<number, Map<number, *>>>}
   */
  async get () {
    throw new errors.NotImplemented(this.constructor.name + '.get')
  }

  /**
   * @param {Object} data
   * @param {string} data.colorCode
   * @param {string} data.txId
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async remove () {
    throw new errors.NotImplemented(this.constructor.name + '.remove')
  }

  /**
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async clear () {
    throw new errors.NotImplemented(this.constructor.name + '.clear')
  }
}

readyMixin(IDataStorage.prototype)
