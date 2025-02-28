## 3.2.1
- [#50](https://github.com/SparshithNR/fs-merger/pull/50) Adding prepublishOnly script

## 3.2.0
- [#47](https://github.com/SparshithNR/fs-merger/pull/47) Remove unused dependencies and update remaining to latest
- [#46](https://github.com/SparshithNR/fs-merger/pull/46) Add basic linting setup
- [#45](https://github.com/SparshithNR/fs-merger/pull/45) Refactors to simplify the FS proxy implementation
- [#44](https://github.com/SparshithNR/fs-merger/pull/44) Fix typo in workflow configuration
- [#41](https://github.com/SparshithNR/fs-merger/pull/41) Migrate to GitHub Actions
- [#40](https://github.com/SparshithNR/fs-merger/pull/40) Ensure all of dist/ is published to npm
- [#39](https://github.com/SparshithNR/fs-merger/pull/39) Ensure yarn.lock is checked in

## 3.0.0
- changed interface for fs proxy from `FSMergerFileOperations` to `FS`

## 2.0.0

- This is a breaking change to migrate from 1.0.0 to 2.0.0.
- `readDirSync` is now `readdirSync` aligning with `fs` function.
- Now you can perform all the `fs` operation other than `write operation` with object created from FSMerger. Below the example usage.

```js
const FSMerger = require('fs-merger');
let fsMerger = new FSMerger([`test`,`bin`]);
fsMerger.fs.readFileSync(`unit-test.js`);
fsMerger.fs.existSync(`unit-test.js`);
```

