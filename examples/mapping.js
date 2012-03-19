var gate = require('../index');
var fs = require('fs');
var exec = require('child_process').exec;

var latch = gate.latch();

// single mapping: arguments[1] in the callback will be result
fs.readFile('file1', 'utf8', latch(1)); 

// multiple mapping: object including arguments[1] and argments[2] in the callback will be result
exec('cat *.js bad_file | wc -l', latch({stdout: 1, stderr: 2}));

// all mapping: all arguments in the callback will be result
fs.readFile('file2', 'utf8', latch());

latch.await(function (err, results) {
  if (err !== null) {
    console.log('exec error: ' + err);
  }
  console.log('file1: ' + results[0]);
  console.log('stdout[1]: ' + results[1].stdout);
  console.log('stderr[1]: ' + results[1].stderr);
  console.log('file2: ' + results[2]);
});