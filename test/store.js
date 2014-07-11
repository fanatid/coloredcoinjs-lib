var expect = require('chai').expect

var coloredcoinlib = require('../src/index')
var store = coloredcoinlib.store


describe('store', function() {
  describe('MemoryDB', function() {
    var db

    beforeEach(function() {
      db = new store.MemoryDB()
    })

    it('has', function() {
      db.set('k', 0)
      expect(db.has('k')).to.be.true
      expect(db.has('v')).to.be.false
    })

    it('set, key is string', function() {
      db.set('key1', 1)
      db.set('key2', 2)
      expect(db.get('key1')).to.equal(1)
      expect(db.get('key2')).to.equal(2)
    })

    it('set, key is object', function() {
      db.set({0: 'a'}, 1)
      db.set({0: 'a'}, 3)
      db.set({1: 'b'}, 2)
      expect(db.get({0: 'a'})).to.equal(3)
      expect(db.get({1: 'b'})).to.equal(2)
    })

    it('get, default value', function() {
      expect(db.get('k', 1)).to.equal(1)
    })
  })

  describe('UnknownTypeDBError', function() {
    it('inherits Error', function() {
      expect(new store.UnknownTypeDBError()).to.be.instanceof(Error)
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

    it('UnknownTypeDBError in constructor', function() {
      var fn = function() { new store.ColorDataStore('') }
      expect(fn).to.throw(store.UnknownTypeDBError);
    })

    function tester() {
      it('add', function(done) {
        cds.add(1, '0000000000000000000000000000000000000000000000000000000000000000', 0, 1, function(error) {
          expect(error).to.be.null
          done()
        })
      })

      it('get', function(done) {
        cds.add(1, '0000000000000000000000000000000000000000000000000000000000000000', 0, 1, function(error) {
          expect(error).to.be.null
          cds.get(1, '0000000000000000000000000000000000000000000000000000000000000000', 0, function(error, record) {
            expect(error).to.be.null
            expect(record).to.deep.equal([1, '0000000000000000000000000000000000000000000000000000000000000000', 0, 1])
            done()
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
    }

    describe('MemoryDB', tester)
  })
})
