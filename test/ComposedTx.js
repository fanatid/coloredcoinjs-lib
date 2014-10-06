var inherits = require('util').inherits

var expect = require('chai').expect

var cclib = require('../src/index')


describe('ComposedTx', function() {
  var tx

  beforeEach(function() {
    var operationalTx = new cclib.OperationalTx()

    tx = new cclib.ComposedTx(operationalTx)
  })

  it('addTxIn/addTxIns/getTxIns', function() {
    tx.addTxIn(null)
    tx.addTxIns([1, 2])
    expect(tx.getTxIns()).to.deep.equal([null, 1, 2])
  })

  it('addTxOut throw Error', function() {
    var target = {
      isUncolored: function() { return false }
    }
    var fn = function() { tx.addTxOut({ target: target }) }
    expect(fn).to.throw(Error)
  })

  it('addTxOut/addTxOuts/getTxOuts', function() {
    tx.addTxOut({
      target: {
        isUncolored: function() { return true },
        getScript: function() { return '1' },
        getValue: function() { return 2 }
      }
    })
    tx.addTxOuts([{ address: '3', value: 4 }])
    tx.getTxOuts([{ address: '1', value: 2 }, { address: '3', value: 4 }])
  })

  it('estimateSize', function() {
    var size = tx.estimateSize({ txIns: 2, txOuts: 3, bytes: 99 })
    expect(size).to.equal(573)
  })

  it('estimateRequiredFee', function() {
    function TestOperationalTx() { cclib.OperationalTx.call(this) }
    inherits(TestOperationalTx, cclib.OperationalTx)
    TestOperationalTx.prototype.getRequiredFee = function(size) { return size*2 }
    var operationalTx = new TestOperationalTx()
    tx = new cclib.ComposedTx(operationalTx)
    var fee = tx.estimateRequiredFee()
    expect(fee).to.equal(88)
  })
})
