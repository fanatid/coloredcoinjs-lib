import { expect } from 'chai'
import { EventEmitter } from 'events'
import _ from 'lodash'

import cclib from '../../src'

describe('ColorDefinitionManager', () => {
  let cdmanager
  let cdstorage
  let epobcDesc1 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:0:0'
  let epobcDesc2 = 'epobc:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff:1:0'

  beforeEach((done) => {
    cdstorage = new cclib.storage.definitions.Memory()
    cdstorage.ready.then(done, done)
    cdmanager = new cclib.definitions.Manager(cdstorage)
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
    it('add new record', (done) => {
      Promise.resolve()
        .then(async () => {
          let cdef = await cdmanager.resolve(epobcDesc1)
          expect(cdef.getDesc()).to.equal(epobcDesc1)
        })
        .then(done, done)
    })

    it('generate event on adding new defintion', (done) => {
      Promise.resolve()
        .then(async () => {
          try {
            let deferred
            let promise = new Promise((resolve, reject) => {
              deferred = {resolve: resolve, reject: reject}
            })

            cdmanager.on('new', (cdef) => {
              Promise.resolve()
                .then(() => {
                  expect(cdef).to.be.instanceof(cclib.definitions.Interface)
                  expect(cdef.getDesc()).to.equal(epobcDesc1)
                })
                .then(deferred.resolve, deferred.reject)
            })

            let cdef = await cdmanager.resolve(epobcDesc1)
            expect(cdef.getDesc()).to.equal(epobcDesc1)
            await promise
          } finally {
            cdmanager.removeAllListeners()
          }
        })
        .then(done, done)
    })

    it('record is not null', (done) => {
      Promise.resolve()
        .then(async () => {
          let data = await cdstorage.resolve(epobcDesc1)
          let cdef = await cdmanager.resolve(data.record.desc)
          expect(cdef.getColorId()).to.equal(data.record.id)
          expect(cdef.getDesc()).to.equal(data.record.desc)
        })
        .then(done, done)
    })

    it('record is null, autoAdd is false', (done) => {
      Promise.resolve()
        .then(async () => {
          let cdef = await cdmanager.resolve(epobcDesc1, {autoAdd: false})
          expect(cdef).to.be.null
        })
        .then(done, done)
    })

    it('return uncolored', (done) => {
      Promise.resolve()
        .then(async () => {
          let cdef = await cdmanager.resolve('')
          expect(cdef).to.be.instanceof(cclib.definitions.Uncolored)
        })
        .then(done, done)
    })
  })

  describe('get', () => {
    it('return null', (done) => {
      Promise.resolve()
        .then(async () => {
          let cdef = await cdmanager.get({id: 10})
          expect(cdef).to.be.null
        })
        .then(done, done)
    })

    it('return uncolred', (done) => {
      Promise.resolve()
        .then(async () => {
          let cdef = await cdmanager.get({id: 0})
          expect(cdef).to.be.instanceof(cclib.definitions.Uncolored)
        })
        .then(done, done)
    })

    it('return ColorDefinition', (done) => {
      Promise.resolve()
        .then(async () => {
          let data = await cdstorage.resolve(epobcDesc1)
          let cdef = await cdmanager.get({id: data.record.id})
          expect(cdef.getDesc()).to.equal(data.record.desc)
          expect(cdef.getColorId()).to.equal(data.record.id)
        })
        .then(done, done)
    })

    it('return empty Array', (done) => {
      Promise.resolve()
        .then(async () => {
          let cdefs = await cdmanager.get()
          expect(cdefs).to.deep.equal([])
        })
        .then(done, done)
    })

    it('return 2 items', (done) => {
      Promise.resolve()
        .then(async () => {
          await* [
            cdmanager.resolve(epobcDesc1),
            cdmanager.resolve(epobcDesc2)
          ]
          let cdefs = await cdmanager.get()
          let result = _.invoke(cdefs, 'getDesc').sort()
          expect(result).to.deep.equal([epobcDesc1, epobcDesc2].sort())
        })
        .then(done, done)
    })
  })
})
