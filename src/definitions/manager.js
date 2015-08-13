import _ from 'lodash'
import { EventEmitter } from 'events'
import { setImmediate } from 'timers'

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
export default class ColorDefinitionManager extends EventEmitter {
  /**
   * @constructor
   */
  constructor (storage) {
    super()

    this._storage = storage
    this._uncolored = new UncoloredColorDefinition()
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
   * @return {Promise.<?ColorDefinition>}
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
   * @return {Promise.<?ColorDefinition>}
   */
  async resolve (desc, opts) {
    if (desc === this._uncolored.getDesc()) {
      return new UncoloredColorDefinition()
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
    setImmediate(() => { this.emit('new', cdef) })
    return cdef
  }

  /**
   * @param {Object} [opts]
   * @param {number} [opts.id]
   * @return {Promise.<(?ColorDefinition|ColorDefinition[])>}
   */
  async get (opts) {
    let id = Object(opts).id
    if (id === undefined) {
      let records = await this._storage.get()
      return await* records.map((record) => {
        return this._record2ColorDefinition(record)
      })
    }

    if (id === this._uncolored.getColorId()) {
      return new UncoloredColorDefinition()
    }

    let record = await this._storage.get({id: id})
    if (record !== null) {
      return this._record2ColorDefinition(record)
    }

    return null
  }
}
