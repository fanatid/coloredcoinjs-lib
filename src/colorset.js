import _ from 'lodash'
import base58 from 'bs58'
import crypto from 'crypto'
import readyMixin from 'ready-mixin'

/**
 * @class ColorSet
 * @mixes ReadyMixin
 */
export default class ColorSet {
  /**
   * @constructor
   * @param {definitions.Manager} cdmanager
   * @param {string[]} cdescs
   */
  constructor (cdmanager, cdescs) {
    this._cdescs = cdescs

    Promise.resolve()
      .then(async () => {
        this._cdefs = await* this._cdescs.map((cdesc) => {
          return cdmanager.resolve(cdesc, {autoAdd: true})
        })
      })
      .then(() => { this._ready(null) }, (err) => { this._ready(err) })
  }

  /**
   * Return a hex string that represent current ColorSet
   * @return {string}
   */
  getColorHash () {
    let cdescs = _.sortBy(this._cdescs)
    // for compact replace ', ' to ',' as in ngcccbase
    let data = JSON.stringify(cdescs).replace(', ', ',')
    let chash = crypto.createHash('sha256').update(data).digest().slice(0, 10)
    return base58.encode(chash)
  }

  /**
   * @return {string[]}
   */
  getColorDescs () {
    return this._cdescs.slice()
  }

  /**
   * @return {Promise.<ColorDefinition[]>}
   */
  async getColorDefinitions () {
    await this.ready
    return this._cdefs.slice()
  }

  /**
   * @return {Promise.<number[]>}
   */
  async getColorIds () {
    await this.ready
    return _.invoke(this._cdefs, 'getColorId')
  }
}

readyMixin(ColorSet.prototype)
