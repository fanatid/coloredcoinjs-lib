import _ from 'lodash'
import IColorDefinitionStorage from './interface'

/**
 * @class AbstractSyncColorDefinitionStorage
 * @extends IColorDefinitionStorage
 */
export default class AbstractSyncColorDefinitionStorage extends IColorDefinitionStorage {
  /**
   * scheme: [desc] = colorId
   *         [~counter] = number (max color id)
   */

  /**
   * @constructor
   * @param {function} StorageCls
   * @param {Object} storageOpts
   */
  constructor (StorageCls, storageOpts) {
    super()

    this._storage = new StorageCls(storageOpts)
    this._storage.open()
      .then(() => { this._ready(null) }, (err) => { this._ready(err) })
  }

  /**
   * @param {string} desc
   * @param {Object} [opts]
   * @param {boolean} [opts.autoAdd=true]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<{record: ?IColorDefinitionStorage~Record, new: ?boolean}>}
   */
  async resolve (desc, opts) {
    await this.ready
    return await this._storage.withLock(async () => {
      let colorId = parseInt(await this._storage.get(desc), 10)
      // exists?
      if (!isNaN(colorId)) {
        return {record: {id: colorId, desc: desc}, new: false}
      }

      // autoAdd = false
      let autoAdd = _.get(opts, 'autoAdd', true)
      if (!autoAdd) {
        return {record: null, new: null}
      }

      // get prev color id
      colorId = parseInt(await this._storage.get('~counter'), 10)
      // counter not exists, try get max color id or set to zero
      if (isNaN(colorId)) {
        colorId = 0
        for (let [, value] of await this._storage.entries()) {
          value = parseInt(value, 10)
          if (!isNaN(value)) {
            colorId = Math.max(colorId, parseInt(value, 10))
          }
        }
      }

      let newColorId = colorId + 1
      // update counter and save desc with new color id
      await* [
        this._storage.set('~counter', newColorId),
        this._storage.set(desc, newColorId)
      ]

      return {record: {id: newColorId, desc: desc}, new: true}
    })
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
  async get (data) {
    await this.ready
    return await this._storage.withLock(async () => {
      if (_.has(data, 'id')) {
        let record = null
        for (let [key, value] of await this._storage.entries()) {
          value = parseInt(value, 10)
          if (value === data.id) {
            record = {id: value, desc: key}
          }
        }
        return record
      }

      let records = []
      for (let [key, value] of await this._storage.entries()) {
        value = parseInt(value, 10)
        if (key !== '~counter' && !isNaN(value)) {
          records.push({id: value, desc: key})
        }
      }
      return records
    })
  }

  /**
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async clear () {
    await this.ready
    await this._storage.withLock(() => {
      return this._storage.clear()
    })
  }
}
