'use strict';

exports.create = create;

var util = require('util');
var assert = require('assert');
var noop = function noop() {};

function create(count) {
  return new Gate(count);
}

function Gate(count) {
  this._async = new Async(count);
}

Object.defineProperty(Gate.prototype, "count", {
  get: function count() { return this._async.count; },
  enumerable: true
});

Gate.prototype.latch = function latch(name, mapping, skipErrorCheck) {
  if (typeof name !== "string") {
      skipErrorCheck = mapping;
      mapping = name;
      name = null;
  }
  return this._async.makeCallback(latch, name, mapping, skipErrorCheck);
};

Gate.prototype.val = function val(value) {
  return new Val(value);
};

Gate.prototype.await = function await(callback) {
  this._async.await(callback);
  this._async.await = noop;  
};

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
  this.results = {};
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

Async.prototype.makeCallback = function makeCallback(caller, name, mapping, skipErrorCheck) {
  var type = typeof mapping;
  assert(type !== 'undefined' || type !== 'number' || type !== 'object', 
    'An argument `mapping` must be a number or an object, if specified.');
  if (this.count === 0) return noop;
  if (this.count > 0) this.count--;
  this.pending++;
  var index = this.index++;
  var location = getLocation(caller);
  var self = this;

  return function callback(error) {
    var next = self.next;
    self.pending--;
    if (!self.canceled) {
      var isError = error instanceof Error;
      if (isError && !('gate_location' in error)) {
        error.gate_location = location;
      }
      if (isError && !skipErrorCheck) {
        self.canceled = true;
        if (next) {
          self.next = noop;
          next(error);
        } else {
          self.error = error;
        }
      } else {
        var result = mapArguments(mapping, arguments);
        if (name === null) {
          self.results[index] = result;
        } else {
          self.results[name] = result;
        }
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

  function getLocation(target) {
    var originalPrepareStackTrace = Error.prepareStackTrace;
    var originalStackTraceLimit = Error.stackTraceLimit;
    Error.prepareStackTrace = prepareStackTrace;
    Error.stackTraceLimit = 1;
    var err = {};
    Error.captureStackTrace(err, target);
    var stack = err.stack;
    Error.prepareStackTrace = originalPrepareStackTrace;
    Error.stackTraceLimit = originalStackTraceLimit;
    return util.format('%s:%d:%d', stack.getFileName(), stack.getLineNumber(), stack.getColumnNumber());

    function prepareStackTrace() {
      return arguments[1][0];
    }
  }
};