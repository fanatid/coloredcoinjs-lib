import { expect } from 'chai'
import _ from 'lodash'
import { pseudoRandomBytes as getRandomBytes } from 'crypto'

import cclib from '../src'

describe('ColorTarget', () => {
  let cdef = new cclib.definitions.Uncolored()
  let script = getRandomBytes(5).toString('hex')
  let value = _.random(1, 10)
  let cvalue
  let ctarget

  beforeEach(() => {
    cvalue = new cclib.ColorValue(cdef, value)
    ctarget = new cclib.ColorTarget(script, cvalue)
  })

  it('getScript', () => {
    expect(ctarget.getScript()).to.equal(script)
  })

  it('getColorValue', () => {
    expect(ctarget.getColorValue()).to.deep.equal(cvalue)
  })

  it('getValue', () => {
    expect(ctarget.getValue()).to.equal(value)
  })

  it('getColorDefinition', () => {
    expect(ctarget.getColorDefinition()).to.deep.equal(cdef)
  })

  it('getColorId', () => {
    expect(ctarget.getColorId()).to.equal(cdef.getColorId())
  })

  it('is uncolored target?', () => {
    expect(ctarget.isUncolored()).to.equal(cdef.getColorCode() === 'uncolored')
  })

  it('sum', () => {
    let ovalue = _.random(1, 10)
    let ocvalue = new cclib.ColorValue(cdef, ovalue)
    let oscript = getRandomBytes(5).toString('hex')
    let octarget = new cclib.ColorTarget(oscript, ocvalue)

    let result = cvalue.plus(ocvalue)
    expect(cclib.ColorTarget.sum([ctarget, octarget])).to.deep.equal(result)
  })

  describe('groupByColorId', () => {
    it('given array of targets haven\'t TargetCls instance', () => {
      let targets = [{
        getColorDefinition: _.constant(new cclib.definitions.Genesis()),
        isUncolored: _.constant(false)
      }]
      let fn = () => {
        cclib.ColorTarget.groupByColorId(targets, cclib.definitions.EPOBC)
      }
      expect(fn).to.throw(Error)
    })

    it('grouped', () => {
      let uncoloredCDef = new cclib.definitions.Uncolored()
      let genesisCDef = new cclib.definitions.Genesis()

      let target1 = {
        _id: _.uniqueId(),
        getColorDefinition: _.constant(uncoloredCDef),
        getColorId: _.constant(uncoloredCDef.getColorId()),
        isUncolored: _.constant(true)
      }
      let target2 = {
        _id: _.uniqueId(),
        getColorDefinition: _.constant(genesisCDef),
        getColorId: _.constant(genesisCDef.getColorId()),
        isUncolored: _.constant(false)
      }

      let expected = {}
      expected[uncoloredCDef.getColorId()] = [target1]
      expected[genesisCDef.getColorId()] = [target2]

      let result = cclib.ColorTarget.groupByColorId(
        [target1, target2], cclib.definitions.Genesis)

      expect(result).to.deep.equal(expected)
    })
  })
})
