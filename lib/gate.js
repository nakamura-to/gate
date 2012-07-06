'use strict';

exports.create = create;

var util = require('util');
var assert = require('assert');
var noop = function noop() {};

function create(options) {
  options = options || {};
  options.count = typeof options.count === 'number' ? options.count : -1;
  options.failFast = options.failFast !== false;
  return new Gate(options);
}

function Gate(options) {
  this.options = options;
  this._async = new Async(options.count, options.failFast);
}

Object.defineProperty(Gate.prototype, "count", {
  get: function count() { return this._async.count; },
  enumerable: true
});

Gate.prototype.latch = function latch(name, mapping) {
  if (typeof name !== "string") {
      mapping = name;
      name = null;
  }
  return this._async.makeCallback(latch, name, mapping);
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

function Async(count, failFast) {
  this.count = count;
  this.failFast = failFast;
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

Async.prototype.makeCallback = function makeCallback(caller, name, mapping) {
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
      if (self.failFast && error instanceof Error) {
        self.canceled = true;
        if (!('gate_location' in error)) {
          error.gate_location = location;
        }
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
  }

  function prepareStackTrace() {
    return arguments[1][0];
  }
};