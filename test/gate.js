var gate = require('../lib/gate.js');
var assert = require('assert');

describe('latch', function() {
  it('should await async calls', function (done) {
    var g = gate.create();
    process.nextTick(g.latch({val: 'a'}));
    process.nextTick(g.latch({val: 'b'}));
    g.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([{val: 'a'}, {val: 'b'}], results);
      done();
    });   
  });

  it('should await async calls with a given count', function (done) {
    var g = gate.create(3);
    g.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([{val: 'a'}, {val: 'b'}, {val: 'c'}], results);
      done();
    });
    process.nextTick(g.latch({val: 'a'}));
    assert.strictEqual(2, g.count);
    process.nextTick(g.latch({val: 'b'}));
    assert.strictEqual(1, g.count);
    process.nextTick(g.latch({val: 'c'}));
    assert.strictEqual(0, g.count);
    process.nextTick(g.latch({val: 'd'}));
    assert.strictEqual(0, g.count);
  });

  it('should await sync calls', function (done) {
    var g = gate.create();
    g.latch({val: 'a'})();
    g.latch({val: 'b'})();
    g.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([{val: 'a'}, {val: 'b'}], results);
      done();
    });
  });

  it('should await sync calls with a given count', function (done) {
    var g = gate.create(3);
    g.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([{val: 'a'}, {val: 'b'}, {val: 'c'}], results);
      done();
    });
    g.latch({val: 'a'})();
    assert.strictEqual(2, g.count);
    g.latch({val: 'b'})();
    assert.strictEqual(1, g.count);
    g.latch({val: 'c'})();
    assert.strictEqual(0, g.count);
    g.latch({val: 'd'})();
    assert.strictEqual(0, g.count);
  });

  it('should handle error', function (done) {
    var g = gate.create();
    var callback = g.latch(1);
    process.nextTick(function () {
      callback('ERROR');
    });
    g.await(function (err) {      
      assert.strictEqual('ERROR', err);
      done();
    });
  });

  it('should handle error object', function (done) {
    var g = gate.create();
    var callback = g.latch(1);
    process.nextTick(function () {
      callback(new Error('ERROR'));
    });
    g.await(function (err) {
      assert.strictEqual('ERROR', err.message);
      assert(err.gate_location);
      done(); 
    });
  });

  it('should skip error check', function (done) {
    var g = gate.create();
    var callback = g.latch(0, true);
    process.nextTick(function () {
      callback('ERROR');
    });
    g.await(function (err, results) {
      if (err) throw err;
      assert.strictEqual('ERROR', results[0]);
      done();
    });
  });

  it('should map values', function (done) {
    var g = gate.create();
    var callback = g.latch({name: 'aaa', age: g.val(20), arg1: 1, arg2: 2});
    process.nextTick(function () {
      callback(0, 'bbb', 100);
    });
    g.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([{name: 'aaa', age: 20, arg1: 'bbb', arg2: 100}], results);
      done();
    });
  });

  it('should map all values', function (done) {
    var g = gate.create();  
    var callback = g.latch();
    process.nextTick(function () {
      callback(null, 'bbb', 100);
    });
    g.await(function (err, results) {
      if (err) throw err;
      assert.deepEqual([[null, 'bbb', 100]], results);
      done();
    });
  });

});
