import { expect } from 'chai'

import cclib from '../src'

let errors = cclib.errors
let ColorValue = cclib.ColorValue

describe('ColorValue', () => {
  let genesisCDef = cclib.definitions.Manager.getGenesis()
  let uncoloredCDef = cclib.definitions.Manager.getUncolored()
  let cv1

  beforeEach(() => {
    cv1 = new ColorValue(uncoloredCDef, 1)
  })

  it('getColorDefinition', () => {
    expect(cv1.getColorDefinition()).to.deep.equal(uncoloredCDef)
  })

  it('getColorId', () => {
    expect(cv1.getColorId()).to.equal(uncoloredCDef.getColorId())
  })

  it('isUncolored return true', () => {
    expect(cv1.isUncolored()).to.be.true
  })

  it('isUncolored return false', () => {
    let cdef = new cclib.definitions.EPOBC(1, {
      txid: '73560ffd916267a70a1233eb63d5d97e79e7eac981a52860df1ac38d2568b3a5',
      oidx: 0,
      height: 274664
    })
    cv1 = new ColorValue(cdef, 1)
    expect(cv1.isUncolored()).to.be.false
  })

  it('getValue', () => {
    expect(cv1.getValue()).to.equal(1)
  })

  it('clone', () => {
    let cv2 = cv1.clone()
    expect(cv2.getColorDefinition()).to.deep.equal(cv1.getColorDefinition())
    expect(cv2.getValue()).to.deep.equal(cv1.getValue())
  })

  it('checkCompatibility not throw', () => {
    let cv2 = new ColorValue(uncoloredCDef, 0)
    let fn = () => { cv1.checkCompatibility(cv2) }
    expect(fn).to.not.throw(errors.IncompatibilityError)
  })

  it('checkCompatibility throw error', () => {
    let cv2 = new ColorValue(genesisCDef, 0)
    let fn = () => { cv1.checkCompatibility(cv2) }
    expect(fn).to.throw(errors.IncompatibilityError)
  })

  it('plus with compatibility', () => {
    let cv2 = new ColorValue(uncoloredCDef, 1)
    let cv3 = cv1.plus(cv2)
    expect(cv3.getValue()).to.equal(cv1.getValue() + cv2.getValue())
  })

  it('plus with not compatibility', () => {
    let cv2 = new ColorValue(genesisCDef, 1)
    let fn = () => { cv1.plus(cv2) }
    expect(fn).to.throw(errors.IncompatibilityError)
  })

  it('neg', () => {
    expect(cv1.neg().getValue()).to.equal(-1)
  })

  it('minus with compatibility', () => {
    let cv2 = new ColorValue(uncoloredCDef, 1)
    let cv3 = cv1.minus(cv2)
    expect(cv3.getValue()).to.equal(cv1.getValue() - cv2.getValue())
  })

  it('minus with not compatibility', () => {
    let cv2 = new ColorValue(genesisCDef, 1)
    let fn = () => { cv1.minus(cv2) }
    expect(fn).to.throw(errors.IncompatibilityError)
  })

  it('sum with compatibility', () => {
    let cv2 = new ColorValue(uncoloredCDef, 1)
    let sum = ColorValue.sum([cv1, cv2]).getValue()
    expect(sum).to.equal(cv1.getValue() + cv2.getValue())
  })

  it('sum with empty colorValues', () => {
    let fn = () => { ColorValue.sum([]) }
    expect(fn).to.throw(Error)
  })

  it('sum with not compatibility', () => {
    let cv2 = new ColorValue(genesisCDef, 1)
    let fn = () => { ColorValue.sum([cv1, cv2]) }
    expect(fn).to.throw(errors.IncompatibilityError)
  })
})
