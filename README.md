Gate — An utility to await multiple asynchronous calls
=======================================================

Gate is an utility to await multiple asynchronous calls in Node environment.

## Installing

```
$ npm install gate
```

## Example

```js
var gate = require('gate');
var fs = require('fs');

var latch = gate.latch();
fs.readFile('file1', 'utf8', latch({name: 'file1', data: 1}));
fs.readFile('file2', 'utf8', latch({name: 'file2', data: 1}));

latch.await(function (err, results) {
  if (err) throw err;
  console.log(results[0]); // { name: 'file1', data: 'FILE1' }
  console.log(results[1]); // { name: 'file2', data: 'FILE2' }
});
```

## API

`gate` module provides following API. 

### latch([Number count]) -> Function

Returns a function which represents a latch. The returned function provides following API.

* `count`: Optional. A number of times the returned function must be called before an awaiting callback can start.

#### ([Object mapping][, Boolean skipErrorCheck]) -> Function

Accepts an argument mapping definition and returns a callback.
If a count is given with `gate.latch()`, the count is decremented.

* `mapping`: Optional. An argument mapping definition. The `mappipng` must be a number or an object.
If the `mapping` is a number, single callback argument is mapped.
If the `mapping` is an object, multiple callback arguments can be mapped.
If the `mapping` is `null` or `undefined`, all callback arguments are mapped as Array.

* `skipErrorCheck`: Optional. Indicates whether error check is skipped or not. Default value is `false`.

### count() -> Number

Gets a current count, if a count is given with `gate.latch()`.
Otherwise, `-1` is returned.

#### val(Object value) -> Object

Wraps a value to distinguish between a value as argument and a mapping index.

* `value`: Required. A value.

#### await(Function callback(err, results)) -> Function

Awaits all asynchronous calls completion and then runs a `callback`.

* `callback`: Required. A callback to run after all asynchronous calls completion.
* `err`: Required. An error to indicate any asynhronous calls are failed.
* `results`: Required. An array to contain each asynchronous call result as element.

## More Examples

### Arguments Mapping

Pass an argument index or an object includes argument indexs to a function being returned from `gate.latch()`. 
In the object, values except whose type is `number` are recognized arguments. 
To pass an number as argument, wrap it with `val` function. 

```js
var gate = require('gate');
var fs = require('fs');
var exec = require('child_process').exec;

var latch = gate.latch();

// single mapping: arguments[1] in the callback will be result
fs.readFile('file1', 'utf8', latch(1)); 

// multiple mapping: arguments[1] and argments[2] in the callback will be result
exec('cat *.js bad_file | wc -l', latch({stdout: 1, stderr: 2}));

// all mapping: arguments will be result
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
```

### Count Down

Pass a count number to `gate.latch()` to wait until a set of callbacks being made.

```js
var gate = require('gate');
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
```

### Error Check Skipping

Pass `true` as 2nd argument to a function being returned from `gate.latch()`. 
This is useful to check each error one by one.

```js
var gate = require('gate');
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
```

### Loop

Call a function being returned from `gate.latch()` in a loop.

```js
var gate = require('gate');
var fs = require('fs');

var latch = gate.latch();
['file1', 'file2'].forEach(function (file) {
  fs.readFile(file, 'utf8', latch({name: file, data: 1}));
});

latch.await(function (err, results) {
  if (err) throw err;
  console.log(results[0]); // { name: 'file1', data: 'FILE1' }
  console.log(results[1]); // { name: 'file2', data: 'FILE2' }
});
```

### Loop in Parallel

Use [Parray](https://github.com/nakamura-to/parallel) to loop array elements in parallel.

```js
var gate = require('gate');
var parray = require('parray');
var fs = require('fs');

var files = ['file1', 'file2'];
var latch = gate.latch();
parray.forEach(files, function (file) {
  fs.readFile(file, 'utf8', latch({name: file, data: 1}));
}, function () {
  latch.await(function (err, results) {
    if (err) throw err;
    console.log(results[0]); // { name: 'file1', data: 'FILE1' }
    console.log(results[1]); // { name: 'file2', data: 'FILE2' }
    console.log('done');
  });
});
```
