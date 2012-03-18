var gate = require('../index');
var fs = require('fs');

var files = ['file1', 'file2'];
var latch = gate.latch(files.length);
latch.await(function (err, results) {
  if (err) throw err;
  console.log(results[0]); // { name: 'file1', data: 'FILE1' }
  console.log(results[1]); // { name: 'file2', data: 'FILE2' }
});

process.nextTick(function () {
  files.forEach(function (file) {
    fs.readFile(file, 'utf8', latch({name: file, data: 1}));
  });
});
