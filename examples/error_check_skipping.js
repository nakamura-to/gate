var gate = require('../index');
var fs = require('fs');

var g = gate.create();
fs.readFile('non-existent1', 'utf8', g.latch({err: 0, data: 1}, true));
fs.readFile('no n-existent2', 'utf8', g.latch({err: 0, data: 1}, true));

g.await(function (err, results) {
  if (results[0].err) {
    console.log(results[0].err);
  }
  if (results[1].err) {
    console.log(results[1].err);
  }
});
