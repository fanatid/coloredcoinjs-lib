import IDataStorage from './interface'
import errors from '../../errors'

/**
 * @class AbstractSyncColorDataStorage
 * @extends IColorDataStorage
 */
export default class AbstractSyncColorDataStorage extends IDataStorage {
  /**
   * scheme: [txId:colorCode][outIndex][colorId] = value
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
      .then(() => this._ready(null), (err) => this._ready(err))
  }

  /**
   * @param {IDataStorage~Record} data
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async add (data) {
    await this.ready

    await this._storage.withLock(async () => {
      let key = `${data.txId}:${data.colorCode}`
      let value = JSON.stringify(data.value)

      // get color values for given txId and colorCode
      let storedValue = await this._storage.get(key)
      let values = storedValue === null ? {} : JSON.parse(storedValue)

      let outValues = values[data.outIndex] || {}

      // throw error if value for given colorId already exists and have
      //   not same value
      if (outValues[data.colorId] !== undefined) {
        if (outValues[data.colorId] === value) {
          return
        }

        throw new errors.Storage.ColorData.HaveAnotherValue(
          data.txId, data.outIndex,
          data.colorId, data.colorCode, outValues[data.colorId])
      }

      // set value and save
      outValues[data.colorId] = value
      values[data.outIndex] = outValues
      await this._storage.set(key, JSON.stringify(values))
    })
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
  async get (data) {
    await this.ready

    let storedValue = await this._storage.withLock(() => {
      let key = `${data.txId}:${data.colorCode}`
      return this._storage.get(key)
    })

    let values = storedValue === null ? {} : JSON.parse(storedValue)
    if (data.outIndex !== undefined) {
      let newValues = {}
      if (values[data.outIndex] !== undefined) {
        newValues[data.outIndex] = values[data.outIndex]
      }

      values = newValues
    }

    let result = new Map()
    for (let outIndex of Object.keys(values)) {
      let ovalues = values[outIndex]
      let oresult = new Map()
      for (let colorId of Object.keys(ovalues)) {
        oresult.set(parseInt(colorId, 10), JSON.parse(ovalues[colorId]))
      }
      result.set(parseInt(outIndex, 10), oresult)
    }

    return result
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
  async remove (data) {
    await this.ready

    await this._storage.withLock(async () => {
      if (data.colorId === undefined) {
        return await this._storage.remove(`${data.txId}:${data.colorCode}`)
      }

      for (let {key, value: serializedValue} of await this._storage.entries()) {
        let changed = false

        let value = JSON.parse(serializedValue)
        for (let outIndex of Object.keys(value)) {
          if (value[outIndex][data.colorId] !== undefined) {
            changed = true

            if (Object.keys(value[outIndex]).length === 1) {
              delete value[outIndex]
            } else {
              delete value[outIndex][data.colorId]
            }
          }
        }

        if (changed) {
          if (Object.keys(value).length === 0) {
            await this._storage.remove(key)
          } else {
            await this._storage.set(key, JSON.stringify(value))
          }
        }
      }
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
