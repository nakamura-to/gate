var gate = require('../index');
var fs = require('fs');

var latch = gate.latch();
fs.readFile('file1', 'utf8', latch({name: 'file1', data: 1}));
fs.readFile('file2', 'utf8', latch({name: 'file2', data: 1}));

latch.await(function (err, results) {
  if (err) throw err;
  console.log(results[0]); // { name: 'file1', data: 'FILE1' }
  console.log(results[1]); // { name: 'file2', data: 'FILE2' }
});
