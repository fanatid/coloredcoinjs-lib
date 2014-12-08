var expect = require('chai').expect

var cclib = require('../src/index')
var util = require('../src/util')


describe('util', function () {
  it('number2bitArray', function () {
    var bits = util.number2bitArray(54648432)
    expect(bits).to.deep.equal(
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0])
  })

  it('bitArray2number', function () {
    var bits = [0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0]
    expect(util.bitArray2number(bits)).to.equal(54648432)
  })

  describe('groupTargetsByColor', function () {
    it('throw Error', function () {
      var targets = [{getColorDefinition: function () {}}]
      var fn = function () { util.groupTargetsByColor(targets, Number) }
      expect(fn).to.throw(Error)
    })

    it('grouped', function () {
      var target1 = {
        getColorDefinition: function () { return new cclib.UncoloredColorDefinition() },
        getColorId: function () { return 0 }
      }
      var target2 = {
        getColorDefinition: function () { return new cclib.UncoloredColorDefinition() },
        getColorId: function () { return 2 }
      }

      var result = util.groupTargetsByColor([target1, target2], cclib.GenesisColorDefinition)
      expect(result).to.deep.equal({'0': [target1], '2': [target2]})
    })
  })

  it('debounce', function (done) {
    var called = 0
    function f() { called += 1 }
    var df = util.debounce(f, 100)
    df()
    setTimeout(df, 30)
    setTimeout(function () {
      expect(called).to.equal(1)
      done()
    }, 150)
  })

  it('makeSerial', function (done) {
    function A() {}
    A.prototype.f = util.makeSerial(function (value, cb) {
      expect(this.constructor.name).to.equal('A')
      setTimeout(function () { cb(value * 2) }, 100)
    })

    var cnt = 0

    var a = new A()
    a.f(1, function (value) {
      expect(value).to.equal(2)
      expect(cnt).to.equal(0)
      cnt += 1

      a.f(3, function (value) {
        expect(value).to.equal(6)
        expect(cnt).to.equal(2)
        done()
      })
    })
    a.f(2, function (value) {
      expect(value).to.equal(4)
      expect(cnt).to.equal(1)
      cnt += 1
    })
  })
})
