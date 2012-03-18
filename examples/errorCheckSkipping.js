var gate = require('../index');
var fs = require('fs');

var latch = gate.latch();
fs.readFile('non-existent1', 'utf8', latch({err: 0, data: 1}, true));
fs.readFile('non-existent2', 'utf8', latch({err: 0, data: 1}, true));

latch.await(function (err, results) {
  results.forEach(function (result) {
    if (result.err) {
      console.log(result.err);
    } 
  });
});
