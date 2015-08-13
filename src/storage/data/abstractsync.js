import IDataStorage from './interface'
import errors from '../../errors'

/**
 * @class AbstractSyncColorDataStorage
 * @extends IColorDataStorage
 */
export default class AbstractSyncColorDataStorage extends IDataStorage {
  /**
   * scheme: [txid:colorCode][oidx][colorId] = value
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
      .then(() => { this._ready() }, (err) => { this._ready(err) })
  }

  /**
   * @param {IDataStorage~Record} data
   * @return {Promise}
   */
  async add (data) {
    await this.ready
    await this._storage.withLock(async () => {
      let key = `${data.txid}:${data.colorCode}`
      let value = JSON.stringify(data.value)

      // get color values for given txid and colorCode
      let storedValue = await this._storage.get(key)
      let values = storedValue === null ? {} : JSON.parse(storedValue)

      let outValues = values[data.oidx] || {}

      // throw error if value for given colorId already exists and have
      //   not same value
      if (outValues[data.colorId] !== undefined) {
        if (outValues[data.colorId] === value) {
          return
        }

        throw new errors.Storage.ColorData.HaveAnotherValue(
          data.txid, data.oidx,
          data.colorId, data.colorCode, outValues[data.colorId])
      }

      // set value and save
      outValues[data.colorId] = value
      values[data.oidx] = outValues
      await this._storage.set(key, JSON.stringify(values))
    })
  }

  /**
   * @param {Object} opts
   * @param {string} opts.colorCode
   * @param {string} opts.txid
   * @param {number} [opts.oidx]
   * @return {Promise.<Map<number, Map<number, *>>>}
   */
  async get (opts) {
    await this.ready
    return await this._storage.withLock(async () => {
      let key = `${opts.txid}:${opts.colorCode}`
      let storedValue = await this._storage.get(key)

      let values = storedValue === null ? {} : JSON.parse(storedValue)
      if (opts.oidx !== undefined) {
        let newValues = {}
        if (values[opts.oidx] !== undefined) {
          newValues[opts.oidx] = values[opts.oidx]
        }

        values = newValues
      }

      let result = new Map()
      for (let oidx of Object.keys(values)) {
        let ovalues = values[oidx]
        let oresult = new Map()
        for (let colorId of Object.keys(ovalues)) {
          oresult.set(parseInt(colorId, 10), JSON.parse(ovalues[colorId]))
        }
        result.set(parseInt(oidx, 10), oresult)
      }

      return result
    })
  }

  /**
   * @param {Object} opts
   * @param {string} opts.colorCode
   * @param {string} opts.txid
   * @return {Promise}
   */
  async remove (opts) {
    await this.ready
    return await this._storage.withLock(() => {
      return this._storage.remove(`${opts.txid}:${opts.colorCode}`)
    })
  }

  /**
   * @return {Promise}
   */
  async clear () {
    await this.ready
    return await this._storage.withLock(() => {
      return this._storage.clear()
    })
  }
}
