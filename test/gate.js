var gate = require('../lib/gate.js');
var assert = require('assert');

describe('latch', function() {
  it('should await async calls', function (done) {
    var latch = gate.latch();
    process.nextTick(latch({val: 'a'}));
    process.nextTick(latch({val: 'b'}));
    latch.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([{val: 'a'}, {val: 'b'}], results);
      done();
    });
  });

  it('should await async calls with a given count', function (done) {
    var latch = gate.latch(3);
    latch.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([{val: 'a'}, {val: 'b'}, {val: 'c'}], results);
      done();
    });
    process.nextTick(latch({val: 'a'}));
    assert.strictEqual(2, latch.count());
    process.nextTick(latch({val: 'b'}));
    assert.strictEqual(1, latch.count());
    process.nextTick(latch({val: 'c'}));
    assert.strictEqual(0, latch.count());
    process.nextTick(latch({val: 'd'}));
    assert.strictEqual(0, latch.count());
  });

  it('should await sync calls', function (done) {
    var latch = gate.latch();
    latch({val: 'a'})();
    latch({val: 'b'})();
    latch.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([{val: 'a'}, {val: 'b'}], results);
      done();
    });
  });

  it('should await sync calls with a given count', function (done) {
    var latch = gate.latch(3);
    latch.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([{val: 'a'}, {val: 'b'}, {val: 'c'}], results);
      done();
    });
    latch({val: 'a'})();
    assert.strictEqual(2, latch.count());
    latch({val: 'b'})();
    assert.strictEqual(1, latch.count());
    latch({val: 'c'})();
    assert.strictEqual(0, latch.count());
    latch({val: 'd'})();
    assert.strictEqual(0, latch.count());
  });

  it('should handle error', function (done) {
    var latch = gate.latch();
    var callback = latch(1);
    process.nextTick(function () {
      callback('ERROR');
    });
    latch.await(function (err) {
      assert.strictEqual('ERROR', err);
      done();
    });
  });

  it('should skip error check', function (done) {
    var latch = gate.latch();
    var callback = latch(0, true);
    process.nextTick(function () {
      callback('ERROR');
    });
    latch.await(function (err, results) {
      if (err) throw err;
      assert.strictEqual('ERROR', results[0]);
      done();
    });
  });

  it('should map values', function (done) {
    var latch = gate.latch();
    var callback = latch({name: 'aaa', age: latch.val(20), arg1: 1, arg2: 2});
    process.nextTick(function () {
      callback(0, 'bbb', 100);
    });
    latch.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([{name: 'aaa', age: 20, arg1: 'bbb', arg2: 100}], results);
      done();
    });
  });

  it('should map all values', function (done) {
    var latch = gate.latch();
    var callback = latch();
    process.nextTick(function () {
      callback(null, 'bbb', 100);
    });
    latch.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([[null, 'bbb', 100]], results);
      done();
    });
  });

});
