Gate — An utility to await multiple asynchronous calls
=======================================================

Gate is an utility to await multiple asynchronous calls in Node environment.

## Installing

```
$ npm install gate
```

## Example

You can get each asynchronous call result by an index or a name.

### Indexed Results

```js
var gate = require('gate');
var fs = require('fs');

var g = gate.create();
fs.readFile('file1', 'utf8', g.latch({data: 1}));
fs.readFile('file2', 'utf8', g.latch({data: 1}));

g.await(function (err, results) {
  if (err) throw err;
  console.log(results[0].data); // content for file1
  console.log(results[1].data); // content for file2
});
```

### Named Results

```js
var gate = require('gate');
var fs = require('fs');

var g = gate.create();
fs.readFile('file1', 'utf8', g.latch('file1Result', {data: 1}));
fs.readFile('file2', 'utf8', g.latch('file2Result', {data: 1}));

g.await(function (err, results) {
  if (err) throw err;
  console.log(results.file1Result.data); // content for file1
  console.log(results.file2Result.data); // content for file2
});
```

## API

`gate` module provides following API. 

#### create([Object options]) -> Gate

Returns a Gate object. 

* `options`: Optional. The `options` can have followng keys.

<table>
<tr>
<th>KEY</th><th>TYPE</th><th>DEFAULT VALUE</th><th>DESCRIPTION</th>
</tr>
<tr>
<td>count</td>
<td>Number</td>
<td>-1</td>
<td>
A number of times the returned function must be called before an awaiting callback can start.
Navative value means that count is not specified.
</td>
</tr>
<tr>
<td>failFast</td>
<td>Boolean</td>
<td>true</td>
<td>
If `failFast` is true, an awaiting callback is invoked as soon as possible when any error is found. 
The found error becomes first argument of the awaiting callback.

If `failFast` is false, all errors are ignored and an awaiting callback is invoked after all asynchronous calls are completed. 
It is your responsiblity to handle errors. 
</td>
</tr>
</table>


```js
var g = gate.create();
```

```js
var g = gate.create({count: 5, failFast: false}});
```

--

`Gate` object provides following API.

#### latch([String name][, Object mapping]) -> Function

Returns a callback. The callback arguments are mapped with a `mapping` definition.
If a count is given to `gate.create()`, the count is decremented.

* `name`: Optional. A name for callback arguments.
If not specified, an index number is used as name.

```js
var g = gate.create();
fs.readFile('file1', 'utf8', g.latch('file1Result', {data: 1})); // name specified
fs.readFile('file2', 'utf8', g.latch({data: 1}));                // name not specified

g.await(function (err, results) {
  if (err) throw err;
  console.log(results.file1Result.data); // content for file1
  console.log(results[1].data);          // content for file2
});

```

* `mapping`: Optional. An argument mapping definition. The `mapping` gives names to callback arguments. The `mappipng` must be a number or an object.
If the `mapping` is a number, single argument is mapped.
If the `mapping` is an object, multiple arguments can be mapped.
If the `mapping` is `null` or `undefined`, all arguments are mapped as Array.

```js
var g = gate.create();
fs.readFile('file1', 'utf8', g.latch(1));                        // single argument
fs.readFile('file2', 'utf8', g.latch({data: 1, name: 'file2'})); // multiple arguments
fs.readFile('file3', 'utf8', g.latch());                         // all arguments

g.await(function (err, results) {
  if (err) throw err;
  console.log(results[0]);      // content for file1
  console.log(results[1].data); // content for file2
  console.log(results[1].name); // arbitrary value for file2
  console.log(results[2][0]);   // read error for file3 (1st argument of fs.readFile callback)
  console.log(results[2][1]);   // content for file3    (2nd argument of fs.readFile callback)
});

```

#### val(Object value) -> Object

Indicates that a value is a plain value and it's not a mapping index.

* `value`: Required. A plain value.

```js
var g = gate.create();

// a number for a `data` property is a mapping index, but a number for `g.val()` is a plain value 
fs.readFile('file1', 'utf8', g.latch({data: 1, i: g.val(1)}));
fs.readFile('file2', 'utf8', g.latch({data: 1, i: g.val(2)}));

g.await(function (err, results) {
  if (err) throw err;
  console.log(results[0].data); // content for file1
  console.log(results[0].i);    // 1
  console.log(results[1].data); // content for file2
  console.log(results[1].i);    // 2
});
```

#### await(Function callback(err, results, gate)) -> Function

Awaits all asynchronous calls completion and then runs a `callback`.

* `callback`: Required. A callback to run after all asynchronous calls completion.
* `err`: An error to indicate any asynhronous calls are failed. 
If the `err` exists, it have a property `gate_location` to inform which async call is related to the `err`.
* `results`: An array to contain each asynchronous call result(arguments of asynchronous callback) as element.
* `gate`: A new gate object;

```js
var g = gate.create();
fs.readFile('file1', 'utf8', g.latch({data: 1}));
fs.readFile('file2', 'utf8', g.latch({data: 1}));

g.await(function (err, results) {
  if (err) {
    console.log(err);
  } else {
    console.log(results[0].data); 
    console.log(results[1].data); 
  }
});

```

### count: Number

Gets a current count, if a count is given to `gate.latch()`.
Otherwise, `-1` is returned.
This is a readonly property.

```js
var g = gate.create(2);

console.log(g.count); // 2
fs.readFile('file1', 'utf8', g.latch({data: 1}));
console.log(g.count); // 1
fs.readFile('file2', 'utf8', g.latch({data: 1}));
console.log(g.count); // 0
```


## More Examples

### Arguments Mapping

Pass an argument index or an object includes argument indexs to a function being returned from `gate.latch()`. 
In the object, values except whose type is `number` are recognized arguments. 
To pass an number as argument, wrap it with `val` function. 

```js
var gate = require('gate');
var fs = require('fs');
var exec = require('child_process').exec;

var g = gate.create();

// single mapping: arguments[1] in the callback will be result
fs.readFile('file1', 'utf8', latch(1)); 

// multiple mapping: arguments[1] and argments[2] in the callback will be result
exec('cat *.js bad_file | wc -l', g.latch({stdout: 1, stderr: 2}));

// all mapping: arguments will be result
fs.readFile('file2', 'utf8', g.latch());

g.await(function (err, results) {
  if (err !== null) {
    console.log('exec error: ' + err);
  }
  console.log('file1: ' + results[0]);
  console.log('stdout: ' + results[1].stdout);
  console.log('stderr: ' + results[1].stderr);
  console.log('file2: ' + results[2]);
});
```

### Count Down

Pass a count number to `gate.create()` to wait until a set of callbacks being completed.

```js
var gate = require('gate');
var fs = require('fs');

var files = ['file1', 'file2'];
var g = gate.create(files.length);
g.await(function (err, results) {
  if (err) throw err;
  console.log(results[0]);
  console.log(results[1]);
});

process.nextTick(function () {
  files.forEach(function (file) {
    fs.readFile(file, 'utf8', g.latch({name: file, data: 1}));
  });
});
```

### Error Handling - handling first error

Check `err.gate_location` at an await callback to know which async call is related to the `err`.

```js
var gate = require('gate');
var fs = require('fs');

var g = gate.create();
fs.readFile('file1', 'utf8', g.latch({name: 'file1', data: 1}));
fs.readFile('non-existent', 'utf8', g.latch({name: 'non-existent', data: 1}));

g.await(function (err, results) {
  if (err) {
    console.log(err + ', gate_location: ' + err.gate_location);
  } else {
    console.log(results);
  }
});
```

### Error Handling - handling all errors

Turn off `failFaslt` and include an error object in each result. 
This is useful to handle all errors.

```js
var gate = require('gate');
var fs = require('fs');

var g = gate.create({failFast: false});
fs.readFile('non-existent1', 'utf8', g.latch({err: 0, data: 1}));
fs.readFile('non-existent2', 'utf8', g.latch({err: 0, data: 1}));

g.await(function (err, results) {
  results.forEach(function (result) {
    if (result.err) {
      console.log(result.err);
    } 
  });
});
```

### Nesting

Use 3rd argument of an awaiting callback to nest 'gate.await()'.

```js
var gate = require('gate');
var fs = require('fs');

var g = gate.create();
fs.readFile('file1', 'utf8', g.latch({data: 1}));
fs.readFile('file2', 'utf8', g.latch({data: 1}));

g.await(function (err, results, g) {
  if (err) throw err;
  var name1 = results[0].data;
  var name2 = results[1].data;
  fs.readFile(name1, 'utf8', g.latch({data: 1}));
  fs.readFile(name2, 'utf8', g.latch({data: 1}));
  g.await(function (err, results, g) {
    if (err) throw err;
    console.log(results[0].data); // content for name1
    console.log(results[1].data); // content for name2
  });
});
```