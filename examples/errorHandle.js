var gate = require('../index');
var fs = require('fs');

var latch = gate.latch();
fs.readFile('file1', 'utf8', latch({name: 'file1', data: 1}));
fs.readFile('non-existent', 'utf8', latch({name: 'non-existent', data: 1}));

latch.await(function (err, results) {
  if (err) throw err;
  console.log(results);
});
