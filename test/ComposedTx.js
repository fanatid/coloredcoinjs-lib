var inherits = require('util').inherits

var expect = require('chai').expect

var cclib = require('../src/index')


describe('ComposedTx', function () {
  var tx

  beforeEach(function () {
    var operationalTx = new cclib.OperationalTx()

    tx = new cclib.ComposedTx(operationalTx)
  })

  it('addTxIn/addTxIns/getTxIns', function () {
    var txIn = {txId: '06a480de0293ce9c2d8c76e15ac3b2f61f5bf7a47d139527ce335bf55b000e8f', outIndex: 0}
    tx.addTxIns([txIn])
    expect(tx.getTxIns()).to.deep.equal([txIn])
  })

  it('addTxOut throw Error', function () {
    var target = {
      isUncolored: function () { return false }
    }
    var fn = function () { tx.addTxOut({target: target}) }
    expect(fn).to.throw(Error)
  })

  it('addTxOut/addTxOuts/getTxOuts', function () {
    var cd = new cclib.UncoloredColorDefinition()
    var cv = new cclib.ColorValue(cd, 2)
    var ct = new cclib.ColorTarget('00', cv)
    tx.addTxOut({target: ct})
    tx.addTxOuts([{script: '11', value: 4}])
    tx.getTxOuts([{script: '00', value: 2}, {script: '11', value: 4}])
  })

  it('estimateSize', function () {
    var size = tx.estimateSize({txIns: 2, txOuts: 3, bytes: 99})
    expect(size).to.equal(573)
  })

  it('estimateRequiredFee', function () {
    function TestOperationalTx() { cclib.OperationalTx.call(this) }
    inherits(TestOperationalTx, cclib.OperationalTx)
    TestOperationalTx.prototype.getRequiredFee = function (size) { return size * 2 }
    var operationalTx = new TestOperationalTx()
    tx = new cclib.ComposedTx(operationalTx)
    var fee = tx.estimateRequiredFee()
    expect(fee).to.equal(88)
  })
})
