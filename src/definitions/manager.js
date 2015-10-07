import _ from 'lodash'
import { EventEmitter } from 'events'
import { setImmediate } from 'timers'
import { mixin } from 'core-decorators'
import ReadyMixin from 'ready-mixin'

import GenesisColorDefinition from './genesis'
import UncoloredColorDefinition from './uncolored'
import errors from '../errors'

/**
 * @event ColorDefinitionManager#new
 * @param {defintions.IColorDefinition} cdef
 */

/**
 * @class ColorDefinitionManager
 * @extends events.EventEmitter
 * @param {IColorDefinitionStorage} storage
 */
@mixin(ReadyMixin)
export default class ColorDefinitionManager extends EventEmitter {
  /**
   * @constructor
   * @param {storage.definitions.Interface} storage
   * @param {storage.data.Interface} dataStorage
   */
  constructor (storage, dataStorage) {
    super()

    this._uncolored = new UncoloredColorDefinition()
    this._storage = storage
    this._dataStorage = dataStorage

    Promise.all([this._storage.ready, this._dataStorage.ready])
      .then(() => this._ready(null), (err) => this._ready(err))
  }

  static _cd_classes = {}

  /**
   * @static
   * @return {UncoloredColorDefinition}
   */
  static getUncolored () {
    return new UncoloredColorDefinition()
  }

  /**
   * @static
   * @return {GenesisColorDefinition}
   */
  static getGenesis () {
    return new GenesisColorDefinition()
  }

  /**
   * @static
   * @param {IColorDefinition} cls
   * @throws {AlreadyRegistered}
   */
  static registerColorDefinitionClass (cls) {
    let clsColorCode = cls.getColorCode()

    if (ColorDefinitionManager._cd_classes[clsColorCode] !== undefined) {
      throw new errors.ColorDefinition.AlreadyRegistered(clsColorCode, cls.name)
    }

    ColorDefinitionManager._cd_classes[clsColorCode] = cls
  }

  /**
   * @static
   * @return {function[]}
   */
  static getColorDefinitionClasses () {
    return _.values(ColorDefinitionManager._cd_classes)
  }

  /**
   * @static
   * @param {string} code
   * @return {?function}
   */
  static getColorDefinitionClass (code) {
    return ColorDefinitionManager._cd_classes[code] || null
  }

  /**
   * @private
   * @param {IColorDefinitionStorage~Record} record
   * @return {Promise<?ColorDefinition>}
   */
  async _record2ColorDefinition (record) {
    let code = record.desc.split(':')[0]
    let Cls = ColorDefinitionManager.getColorDefinitionClass(code)
    if (Cls === null) {
      return null
    }

    return await Cls.fromDesc(record.desc, record.id)
  }

  /**
   * Return ColorDefinition instance if desc in store.
   *  Otherwise if autoAdd is true creates new ColorDefinition, add to store
   *    and return it
   *
   * @param {string} desc
   * @param {Object} [opts]
   * @param {boolean} [opts.autoAdd=true]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<?([ColorDefinition, boolean])>}
   */
  async resolve (desc, opts) {
    await this.ready

    if (desc === this._uncolored.getDesc()) {
      return [new UncoloredColorDefinition(), false]
    }

    // check desc
    let cdef = await this._record2ColorDefinition({id: -1, desc: desc})
    if (cdef === null) {
      throw new errors.ColorDefinition.IncorrectDesc(desc)
    }

    // resolve desc
    let data = await this._storage.resolve(desc, opts)
    if (data.record === null) {
      return null
    }

    // create color definition from record
    cdef = await this._record2ColorDefinition(data.record)
    if (data.new) {
      setImmediate(() => { this.emit('new', cdef) })
    }

    return [cdef, data.new]
  }

  /**
   * @param {Object} data
   * @param {number} [data.id]
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise<(?ColorDefinition|ColorDefinition[])>}
   */
  async get (data, opts) {
    await this.ready

    if (_.has(data, 'id')) {
      if (data.id === this._uncolored.getColorId()) {
        return new UncoloredColorDefinition()
      }

      let record = await this._storage.get(data, opts)
      if (record !== null) {
        return this._record2ColorDefinition(record)
      }

      return null
    }

    let records = await this._storage.get(data, opts)
    return await* records.map((record) => {
      return this._record2ColorDefinition(record)
    })
  }

  /**
   * @param {Object} data
   * @param {number} data.id
   * @param {Object} [opts]
   * @param {Object} [opts.executeOpts]
   * @return {Promise}
   */
  async remove (data, opts) {
    await this.ready

    await this._dataStorage.remove({colorId: data.id}, opts)
    await this._storage.remove({id: data.id}, opts)
  }
}
