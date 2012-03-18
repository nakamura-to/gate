'use strict';

exports.latch = latch;

var assert = require('assert');
var noop = function noop() {};

function latch(count) {
  var async = new Async(count);
  var _latch = function makeCallback(mapping, skipErrorCheck) {
    return async.makeCallback(mapping, skipErrorCheck);
  };
  _latch.val = function val(value) {
    return new Val(value);
  };
  _latch.count = function count() {
    return async.count;
  };
  _latch.await = function await(callback) {
    async.await(callback);
    async.await = noop;
  };
  return _latch;
}

function Val(value) {
  this.value = value;
}

function Async(count) {
  this.count = typeof count === 'number' ? count : -1;
  this.index = 0;
  this.pending = 0;
  this.canceled = false;
  this.next = null;
  this.error = null;
  this.results = [];
}

Async.prototype.await = function await(callback) {
  if (this.error) {
    callback(this.error);
  } else if (this.pending === 0 && this.count <= 0) {
    callback(null, this.results);
  } else {
    this.next = callback;
  }
};

Async.prototype.makeCallback = function makeCallback(mapping, skipErrorCheck) {
  var type = typeof mapping;
  assert(type !== 'undefined' || type !== 'number' || type !== 'object', 
    'An argument `mapping` must be a number or an object, if specified.');
  if (this.count === 0) return noop;
  if (this.count > 0) this.count--;
  this.pending++;
  var index = this.index++;
  var self = this;

  return function asyncCallback(error) {
    var next = self.next;
    self.pending--;
    if (!self.canceled) {
      if (error && !skipErrorCheck) {
        self.canceled = true;
        if (next) {
          self.next = noop;
          next(error);
        } else {
          self.error = error;
        }
      } else {
        self.results[index] = mapArguments(mapping, arguments);
        if (self.pending === 0 && self.count <= 0 && next) {
          self.next = noop;
          next(null, self.results);
        }
      }
    }
  };
  
  function mapArguments(mapping, args) {
    if (typeof mapping === 'number') return args[mapping];
    if (!mapping) return Array.prototype.slice.call(args);
    return Object.keys(mapping).reduce(function (result, key) {
      var value = mapping[key];
      if (typeof value === 'number') {
        result[key] = args[value];
      } else if (value instanceof Val) {
        result[key] = value.value;
      } else {
        result[key] = value;
      }
      return result;
    }, {});
  }
};