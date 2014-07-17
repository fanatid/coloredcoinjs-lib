var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var store = coloredcoinlib.store


describe('store', function() {
  describe('MemoryDB', function() {
    var db

    beforeEach(function() {
      db = new store.MemoryDB()
    })
  })

  describe('UnknownTypeDBError', function() {
    it('inherits Error', function() {
      expect(new store.UnknownTypeDBError()).to.be.instanceof(Error)
      expect(new store.UnknownTypeDBError()).to.be.instanceof(store.UnknownTypeDBError)
    })
  })

  describe('UniqueConstraintError', function() {
    it('inherits Error', function() {
      expect(new store.UniqueConstraintError()).to.be.instanceof(Error)
      expect(new store.UniqueConstraintError()).to.be.instanceof(store.UniqueConstraintError)
    })
  })

  describe('DataStore', function() {
    it('UnknownTypeDBError in constructor', function() {
      var fn = function() { new store.ColorDataStore('') }
      expect(fn).to.throw(store.UnknownTypeDBError)
    })
  })

  describe('ColorDataStore', function() {
    var cds

    beforeEach(function() {
      cds = new store.ColorDataStore('memory')
    })

    it('inherits DataStore', function() {
      expect(cds).to.be.instanceof(store.DataStore)
      expect(cds).to.be.instanceof(store.ColorDataStore)
    })

    function tester() {
      it('add', function(done) {
        cds.add(1, '0000000000000000000000000000000000000000000000000000000000000000', 0, 1, function(error) {
          expect(error).to.be.null
          done()
        })
      })

      it('add, UniqueConstraintError', function(done) {
        cds.add(1, '0000000000000000000000000000000000000000000000000000000000000000', 0, 1, function(error) {
          expect(error).to.be.null
          cds.add(1, '0000000000000000000000000000000000000000000000000000000000000000', 1, 1, function(error) {
            expect(error).to.be.null
            cds.add(1, '0000000000000000000000000000000000000000000000000000000000000000', 1, 2, function(error) {
              expect(error).to.be.instanceof(store.UniqueConstraintError)
              done()
            })
          })
        })
      })

      it('get', function(done) {
        cds.add(1, '0000000000000000000000000000000000000000000000000000000000000000', 1, 1, function(error) {
          expect(error).to.be.null
          cds.add(1, '0000000000000000000000000000000000000000000000000000000000000000', 0, 1, function(error) {
          expect(error).to.be.null
            cds.get(1, '0000000000000000000000000000000000000000000000000000000000000000', 0, function(error, record) {
              expect(error).to.be.null
              expect(record).to.deep.equal({
                colorId: 1,
                txId: '0000000000000000000000000000000000000000000000000000000000000000',
                outIndex: 0,
                value: 1
              })
              done()
            })
          })
        })
      })

      it('get null', function(done) {
        cds.get(1, '0000000000000000000000000000000000000000000000000000000000000000', 0, function(error, record) {
          expect(error).to.be.null
          expect(record).to.be.null
          done()
        })
      })

      it('getAny', function(done) {
        cds.add(1, '0000000000000000000000000000000000000000000000000000000000000000', 0, 1, function(error) {
          expect(error).to.be.null
          cds.add(1, '0000111122223333444455556666777788889999aaaabbbbccccddddeeeeffff', 0, 1, function(error) {
            expect(error).to.be.null
            cds.getAny('0000000000000000000000000000000000000000000000000000000000000000', 0, function(error, records) {
              expect(error).to.be.null
              expect(records).to.deep.equal([{
                colorId: 1,
                txId: '0000000000000000000000000000000000000000000000000000000000000000',
                outIndex: 0,
                value: 1
              }])
              done()
            })
          })
        })
      })
    }

    describe('MemoryDB', tester)
  })

  describe('ColorDefinitionStore', function() {
    var cms

    beforeEach(function() {
      cms = new store.ColorDefinitionStore('memory')
    })

    it('inherits DataStore', function() {
      expect(cms).to.be.instanceof(store.DataStore)
      expect(cms).to.be.instanceof(store.ColorDefinitionStore)
    })

    function tester() {
      it('not exists and autoAdd is false', function(done) {
        cms.resolveColorDesc('desc', false, function(error, colorId) {
          expect(error).to.be.null
          expect(colorId).to.be.null
          done()
        })
      })

      it('resolveColorDesc thrice', function(done) {
        cms.resolveColorDesc('desc', true, function(error, colorId) {
          expect(error).to.be.null
          expect(colorId).to.equal(1)
          cms.resolveColorDesc('desc2', true, function(error, colorId) {
            expect(error).to.be.null
            expect(colorId).to.equal(2)
            cms.resolveColorDesc('desc', true, function(error, colorId) {
              expect(error).to.be.null
              expect(colorId).to.equal(1)
              done()
            })
          })
        })
      })

      it('findColorDesc', function(done) {
        cms.resolveColorDesc('desc', true, function(error, colorId) {
          expect(error).to.be.null
          cms.findColorDesc(colorId, function(error, colorDesc) {
            expect(error).to.be.null
            expect(colorDesc).to.equal('desc')
            done()
          })
        })
      })

      it('findColorDesc not found', function(done) {
        cms.resolveColorDesc('desc', true, function(error, colorId) {
          expect(error).to.be.null
          cms.findColorDesc(colorId+1, function(error, colorDesc) {
            expect(error).to.be.null
            expect(colorDesc).to.be.null
            done()
          })
        })
      })
    }

    describe('MemoryDB', tester)
  })
})
