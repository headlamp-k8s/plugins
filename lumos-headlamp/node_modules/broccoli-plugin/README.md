# The Broccoli Plugin Base Class

[![Build Status](https://travis-ci.org/broccolijs/broccoli-plugin.svg?branch=master)](https://travis-ci.org/broccolijs/broccoli-plugin)
[![Build status](https://ci.appveyor.com/api/projects/status/k4tk8b99m1e58ftd?svg=true)](https://ci.appveyor.com/project/joliss/broccoli-plugin)

## Example Usage

```js
const Plugin = require('broccoli-plugin');

class MyPlugin extends Plugin {
  constructor(inputNodes, options = {}) {
    super(inputNodes, {
      annotation: options.annotation,
      // see `options` in the below README to see a full list of constructor options
    });
  }

  build() {
    // Read files from this.inputPaths, and write files to this.outputPath.
    // Silly example:

    // Read 'foo.txt' from the third input node
    const input = this.input.readFileSync(`foo.txt`);
    const output = someCompiler(input);

    // Write to 'bar.txt' in this node's output
    this.output.writeFileSync(`bar.txt`, output);
  }
}
```

## Reference

### `new Plugin(inputNodes, options)`

Call this base class constructor from your subclass constructor.

- `inputNodes`: An array of node objects that this plugin will read from.
  Nodes are usually other plugin instances; they were formerly known as
  "trees".

- `options`

  - `name`: The name of this plugin class. Defaults to `this.constructor.name`.
  - `annotation`: A descriptive annotation. Useful for debugging, to tell
    multiple instances of the same plugin apart.
  - `persistentOutput`: If true, the output directory is not automatically
    emptied between builds.
  - `needsCache` : If `true`, a cache directory is created automatically
    and the path is set at `cachePath`. If `false`, a cache directory is not created
    and `this.cachePath` is `undefined`. Defaults to `true`.
  - `volatile` : If `true`, memoization will not be applied and the build method will
    always be called regardless if the inputNodes have changed. Defaults to `false`.
  - `trackInputChanges` : If `true`, a change object will be passed to the build method which contains
    information about which input has changed since the last build. Defaults to `false`.

### `Plugin.prototype.build()`

Override this method in your subclass. It will be called on each (re-)build.

This function will typically access the following read-only properties:

- `this.inputPaths`: An array of paths on disk corresponding to each node in
  `inputNodes`. Your plugin will read files from these paths.

- `this.outputPath`: The path on disk corresponding to this plugin instance
  (this node). Your plugin will write files to this path. This directory is
  emptied by Broccoli before each build, unless the `persistentOutput` options
  is true.

- `this.cachePath`: The path on disk to an auxiliary cache directory. Use this
  to store files that you want preserved between builds. This directory will
  only be deleted when Broccoli exits. If a cache directory is not needed, set
  `needsCache` to `false` when calling `broccoli-plugin` constructor.

All paths stay the same between builds.

To perform asynchronous work, return a promise. The promise's eventual value
is ignored (typically `null`).

To report a compile error, `throw` it or return a rejected promise. Also see
section "Error Objects" below.

If the `trackInputChanges` option was set to `true`, an object will be passed to the
build method with the shape of:

```js
{
  changedNodes: [true, true, ...]
}
```

This array contain a booleans corresponding to each input node as to whether or not that node changed since the last rebuild. For the initial build all values in the array will be `true`.

### `Plugin.prototype.getCallbackObject()`

Advanced usage only.

Return the object on which Broccoli will call `obj.build()`. Called once after
instantiation. By default, returns `this`. Plugins do not usually need to
override this, but it can be useful for base classes that other plugins in turn
derive from, such as
[broccoli-caching-writer](https://github.com/ember-cli/broccoli-caching-writer).

For example, to intercept `.build()` calls, you might
`return { build: this.buildWrapper.bind(this) }`.
Or, to hand off the plugin implementation to a completely separate object:
`return new MyPluginWorker(this.inputPaths, this.outputPath, this.cachePath)`,
where `MyPluginWorker` provides a `.build` method.

### Error Objects

To help with displaying clear error messages for build errors, error objects
may have the following optional properties in addition to the standard
`message` property:

- `file`: Path of the file in which the error occurred, relative to one of the
  `inputPaths` directories
- `treeDir`: The path that `file` is relative to. Must be an element of
  `this.inputPaths`. (The name `treeDir` is for historical reasons.)
- `line`: Line in which the error occurred (one-indexed)
- `column`: Column in which the error occurred (zero-indexed)

### `Plugin.prototype.input`

An api which enables a plugin to easily read from one or more input directories ergonomically and safely.

_Note: We recommend users stop using this.inputPaths and instead rely on this.input. Our plan at present is to strongly consider deprecation of this.inputPaths once this.input has had time to bake._

this.input's features:

- `this.input` reads from the provided `inputPaths`. No path concatenation required.
- `this.input` provides readOnly file system APIs. This prevents a plugin from erroneously mutating its inputs.
- `this.input` provides a merged view of inputs, this allows every plugin to easily support multiple inputs, without the use of `broccoli-merge-trees` or implementing a complex merge algorithm.
- `this.input.at(index)` provides access to each individual input if desired.

Example:

```js
// old
fs.readFileSync(this.inputPaths[0] + '/file.txt');

// new (merged): Most Common
this.input.readFileSync('file.txt');

// new (indexed): For when you need to disambiguate between inputs.
this.input.at(0).readFileSync('file.txt);

// ReadOnly
this.input.writeFileSync // throws error
```

### List of Methods

- readFileSync
- existsSync
- lstatSync
- statSync
- readdirSync
- at

Read more about `input` [here](https://github.com/SparshithNR/fs-merger#fsmergerfs)

Note: `input` will be available only after the `build` starts.

### `Plugin.prototype.output`

An api which enables a plugin to easily write to the output directory ergonomically and safely.

_Note: We recommend users stop using this.outputPath and instead rely on this.output. Our plan at present is to strongly consider deprecation of this.outputPath once this.output has had time to bake._

this.output's features:

- `this.ouput` writes to the `outputPath`. No path concatenation required.
- `this.output` provides read operations on the `outputPath`. No path concatenation required.

Ex:

```js
// old
fs.writeFileSync(this.outputPath + '/file.txt', 'text');

// new
this.output.writeFileSync('file.txt', 'text');
```

### List of Methods

- readFileSync
- existsSync
- lstatSync
- readdirSync
- statSync
- writeFileSync
- appendFileSync
- rmdirSync
- mkdirSync

Read more about APIs present in `output` [here](https://github.com/SparshithNR/broccoli-output-wrapper#apis).

Note: `output` will be available only after the `build` starts.
