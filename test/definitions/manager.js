import { expect } from 'chai'
import { EventEmitter } from 'events'
import _ from 'lodash'
import PUtils from 'promise-useful-utils'

import cclib from '../../src'

describe('ColorDefinitionManager', () => {
  let cdmanager
  let cdstorage
  let epobcDesc1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  let epobcDesc2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach(() => {
    cdstorage = new cclib.storage.definitions.Memory()
    cdmanager = new cclib.definitions.Manager(cdstorage)
    return cdstorage.ready
  })

  it('inherit EventEmitter', () => {
    expect(cdmanager).to.be.instanceof(cclib.definitions.Manager)
    expect(cdmanager).to.be.instanceof(EventEmitter)
  })

  it('getUncolored', () => {
    let cdef = cclib.definitions.Manager.getUncolored()
    expect(cdef).to.be.instanceof(cclib.definitions.Uncolored)
    expect(cdef).to.deep.equal(new cclib.definitions.Uncolored())
  })

  it('getGenesis', () => {
    let cdef = cclib.definitions.Manager.getGenesis()
    expect(cdef).to.be.instanceof(cclib.definitions.Genesis)
    expect(cdef).to.deep.equal(new cclib.definitions.Genesis())
  })

  describe('ColorDefinitions: register, get all, get by code', () => {
    it('already registered', () => {
      let fn = () => {
        cclib.definitions.Manager.registerColorDefinitionClass(
          cclib.definitions.EPOBC)
      }
      expect(fn).to.throw(cclib.errors.ColorDefinition.AlreadyRegistered)
    })

    it('return null', () => {
      let cdcls = cclib.definitions.Manager.getColorDefinitionClass('x')
      expect(cdcls).to.be.null
    })

    it('return registered color definition', () => {
      let cdcls = cclib.definitions.Manager.getColorDefinitionClass('epobc')
      expect(cdcls).to.equal(cclib.definitions.EPOBC)
    })

    it('return array of registered color definitions', () => {
      let classes = cclib.definitions.Manager.getColorDefinitionClasses()
      expect(classes).to.deep.equal([cclib.definitions.EPOBC])
    })
  })

  describe('resolve', () => {
    it('add new record', async () => {
      let [cdef, isNew] = await cdmanager.resolve(epobcDesc1)
      expect(cdef.getDesc()).to.equal(epobcDesc1)
      expect(isNew).to.be.true
    })

    it('generate event on adding new defintion', async () => {
      try {
        let deferred
        let promise = new Promise((resolve, reject) => {
          deferred = {resolve: resolve, reject: reject}
        })

        cdmanager.on('new', (cdef) => {
          PUtils.try(() => {
            expect(cdef).to.be.instanceof(cclib.definitions.Interface)
            expect(cdef.getDesc()).to.equal(epobcDesc1)
          })
          .then(deferred.resolve, deferred.reject)
        })

        let [cdef, isNew] = await cdmanager.resolve(epobcDesc1)
        expect(cdef.getDesc()).to.equal(epobcDesc1)
        expect(isNew).to.be.true

        await promise
      } finally {
        cdmanager.removeAllListeners()
      }
    })

    it('record is not null', async () => {
      let data = await cdstorage.resolve(epobcDesc1)
      let [cdef, isNew] = await cdmanager.resolve(data.record.desc)
      expect(cdef.getColorId()).to.equal(data.record.id)
      expect(cdef.getDesc()).to.equal(data.record.desc)
      expect(isNew).to.be.false
    })

    it('record is null, autoAdd is false', async () => {
      let cdef = await cdmanager.resolve(epobcDesc1, {autoAdd: false})
      expect(cdef).to.be.null
    })

    it('return uncolored', async () => {
      let [cdef, isNew] = await cdmanager.resolve('')
      expect(cdef).to.be.instanceof(cclib.definitions.Uncolored)
      expect(isNew).to.be.false
    })
  })

  describe('get', () => {
    it('return null', async () => {
      let cdef = await cdmanager.get({id: 10})
      expect(cdef).to.be.null
    })

    it('return uncolred', async () => {
      let cdef = await cdmanager.get({id: 0})
      expect(cdef).to.be.instanceof(cclib.definitions.Uncolored)
    })

    it('return ColorDefinition', async () => {
      let data = await cdstorage.resolve(epobcDesc1)
      let cdef = await cdmanager.get({id: data.record.id})
      expect(cdef.getDesc()).to.equal(data.record.desc)
      expect(cdef.getColorId()).to.equal(data.record.id)
    })

    it('return empty Array', async () => {
      let cdefs = await cdmanager.get()
      expect(cdefs).to.deep.equal([])
    })

    it('return 2 items', async () => {
      await* [
        cdmanager.resolve(epobcDesc1),
        cdmanager.resolve(epobcDesc2)
      ]
      let cdefs = await cdmanager.get()
      let result = _.invoke(cdefs, 'getDesc').sort()
      expect(result).to.deep.equal([epobcDesc1, epobcDesc2].sort())
    })
  })
})
