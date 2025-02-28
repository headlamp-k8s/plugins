## Introduction
This library helps to mask the underlying folder structure and simluates that all the files are stored under a single folder.
For example:
```js
/* test-1
    |
    -- a.txt
    -- b.txt

    test-2
    |
    -- c.txt
    -- d.txt
    -- sub-dir
        |
        -- x.txt
        -- y.txt

    test-3
    |
    -- e.txt
    -- a.txt
 */
```

For the consumer of the library it will look like all the folders are merged from left to right and now under same folder.

```js
/*
-- b.txt
-- c.txt
-- c.txt
-- d.txt
-- sub-dir
    |
    -- x.txt
    -- y.txt
-- e.txt
-- a.txt (since we are mergeing from left to right a.txt from test-1 gets overwritten by a.txt of test-3)
*/
```

This library simulates the behaviour of the [broccoli-merge-trees](https://github.com/broccolijs/broccoli-merge-trees)

## Usage
Constructor can take inputs of the type `string`, `BroccoliNode` or FSMerger expected format of Object explained [here](#fsmerger-special-Object)

```js
let FSMerge = require('fs-merger');
let fs = new FSMerge(['test-1', 'test-2', 'test-3']);
/* test-1
    |
    -- a.txt
    -- b.txt

    test-2
    |
    -- c.txt
    -- d.txt
    -- sub-dir
        |
        -- x.txt
        -- y.txt

    test-3
    |
    -- e.txt
    -- a.txt
 */
 let contentB = fs.readFileSync('b.txt'); // content of test-1/b.txt
 let contentSubDir = fs.readFileSync('sub-dir/x.txt'); //content of test-2/sub-dir/x.txt
 let contentA = fs.readFileSync('a.txt'); // content of test-3/a.txt; here we merge left to right, duplicate files are overwritten
 ```

## FSMerger Special Object
This kind of input is supported only to help broccoli-persistent-filter to reduce the number of merges and funnels needed to be performed before it is passed down to
persistent filter's constructor is called.

This library will help in avoding unneccesary merge required before calling broccoli-persistent-filter plugin.

For example:
```js
// filter.js
const Filter = require('broccoli-persistent-filter');
class TestFilter extends Filter {
    constructor(nodes) {
      super(nodes);
    }

    processString(content) {
        return content.replace(/broccoli/gi, `filter`);
    }
};
```
```js
/* input structure
fixture
    |
    -- docs
        |
        -- c.txt
        -- d.txt
    -- example
        |
        -- map.js
*/
```

```js
// BrocFile.js
const Funnel =  require('broccoli-funnel');
const MergeTree = require('broccoli-merge-trees');
let mergedTree = new MergeTree([
  new Funnel('fixture/docs', {
    destDir: 'documents'
  }),
  new Funnel('fixture/example', {
    getDestinationPath: function (relativePath) {
      if (relativePath.includes('map.js')) {
        return 'metal.js';
      }
      return relativePath;
    }
  }),
]);
module.exports = new TestFilter(mergedTree);
```

```sh
broccoli build dist
# output
# dist
#   |
#   --documents
#       |
#       -- c.txt
#       -- d.txt
#   --example
#       |
#       -- metal.js
```
With this new library we can write the same above as following once [PR](https://github.com/stefanpenner/broccoli-persistent-filter/pull/175) is merged into `broccoli-persistent-filter`.

```js

let FSMergerObjectWithPrefix = {
    root: 'fixture/docs',
    prefix: 'documents'
}

let FSMergerObjectWithFileDest = {
    root: 'fixture/example',
    getDestinationPath:  function (relativePath) {
      if (relativePath.includes('map.js')) {
        return 'metal.js';
      }
      return relativePath;
    }
}

module.exports = new TestFilter([FSMergerObjectWithPrefix, FSMergerObjectWithFileDest]);

```

This new library helped in removing two funnels which where used only for the sake of renaming at the output of persitent filter and mergeTree was performed because persitent filter was restricted to accept only one inputNode.

## FSMerger.fs

`FSMerge.fs` is a proxy for the file operations and few whitelisted fsmerger operations

Following are the operation which `FSMerger.fs` supports

All these are standard `fs` operations. Refer node guide for [file handling](https://nodejs.org/api/fs.html)
* readFileSync
* existsSync
* lstatSync
* statSync
* readdirSync
* readdir

Following are specfic to `FSMerger`
* readFileMeta

Reads the filemeta passed down while creating the new FSMerger instance for a specific root.
Ex:
```js
/*
fixture
    |
    -- docs
        |
        -- c.txt
        -- d.txt
*/
let FSMergerObjectWithPrefix = {
    root: 'fixture/docs',
    prefix: 'documents'
}
let FSMerge = require('fs-merger');
let fsmerge = new FSMerge([FSMergerObjectWithPrefix]);
let filemeta = fsmerge.fs.readFileMeta('c.txt');
/*
filemeta will look something like this
{
  path: 'fixture/docs/c.txt',
  prefix: 'document'
  getDestinationPath: undefined
}
*/

```
* at

This function is used to retrive file from a specfic input path (or root) directory. This function can used when we have same filename in mulitple inputPaths and we want spicific inputPath
ex:
```js
let FSMerge = require('fs-merger');
let fsmerge = new FSMerge(['test-1', 'test-2', 'test-3']);
/* test-1
    |
    -- a.txt
    -- b.txt

    test-2
    |
    -- c.txt
    -- d.txt
    -- sub-dir
        |
        -- x.txt
        -- y.txt

    test-3
    |
    -- e.txt
    -- a.txt
 */
 let contentA = fs.readFileSync('a.txt'); // content of test-3/a.txt; here we merge left to right, duplicate files are overwritten
 let contentB = fsmerge.fs.at(0).readFileSync('a.txt'); // content of test-1/a.txt
 let contentC = fsmerge.fs.at(2).readFileSync('a.txt'); // content of test-3/a.txt; here we merge left to right, duplicate files are overwritten
 let contentSubDir = fsmerge.fs.at(1).readFileSync('sub-dir/x.txt'); //content of test-2/sub-dir/x.txt
 ```


* `entries` - performs same functionality as in `walk-sync`. Refer the `walk-sync` [guide here](https://github.com/joliss/node-walk-sync#entries).

* `relativePathTo` - Converts an absolute path into a `relativePath` and an `at` index
  suitable for use when calling the other FSMerger methods.