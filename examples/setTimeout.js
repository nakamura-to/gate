var gate = require('../index');

var latch = gate.latch();
setTimeout(latch({val: 'a'}), 30);
setTimeout(latch({val: 'b'}), 20);
setTimeout(latch({val: 'c'}), 10);

latch.await(function (err, results) {
  if (err) throw err;
  console.log(results);
});
