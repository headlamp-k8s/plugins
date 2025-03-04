[![CircleCI](https://circleci.com/gh/igor-dv/jest-specific-snapshot.svg?style=svg)](https://circleci.com/gh/igor-dv/jest-specific-snapshot)

---

# Jest Specific Snapshot

Jest matcher for multiple snapshot files per test

<b>You can read about the implementation [here](https://medium.com/@davydkin.igor/adding-multi-snapshot-testing-to-jest-b61f23cf17ca)</b>

# Installation

```sh
npm i -D jest-specific-snapshot
```

# Example

```js
const path = require('path');
// extend jest to have 'toMatchSpecificSnapshot' matcher
require('jest-specific-snapshot');

test('test', () => {
  // provides snapshot file with absolute file
  const pathToSnap = path.resolve(process.cwd(), './example/specific/dir/my.shot');
  expect(100).toMatchSpecificSnapshot(pathToSnap);

  //same snapshot but with relative file
  expect(14).toMatchSpecificSnapshot('./specific/dir/my.shot');

  // another snapshot file in the same test
  expect(19).toMatchSpecificSnapshot('./specific/another_dir/another.shot');
});
```

## With Custom Serializer

```js
// extend jest to have 'toMatchSpecificSnapshot' matcher
const addSerializer = require('jest-specific-snapshot').addSerializer;

addSerializer(/* Add custom serializer here */);

test('test', () => {
  expect(/* thing that matches the custom serializer */).toMatchSpecificSnapshot(
    './specific/custom_serializer/test.shot'
  );
});
```

## Extend `toMatchSpecificSnapshot`

```js
const toMatchSpecificSnapshot = require('jest-specific-snapshot').toMatchSpecificSnapshot;

expect.extend({
  toMatchDecoratedSpecificSnapshot(received, snapshotFile) {
    // You can modify received data or create dynamic snapshot path
    const data = doSomeThing(received);
    return toMatchSpecificSnapshot.call(this, data, snapshotFile);
  },
});
```

# Limitations

1.  Snapshot files should have an extension **other** than `.snap`, since it conflicts with jest.
2.  In order to handle the `--updateSnapshot` (`-u`) parameter provided from CLI, there is an abuse of the `SnapshotState._updateSnapshot` private field. TBD - try to use the `globalConfig` to get this state.
3.  `.toMatchSpecificSnapshot` does ignore a custom serializers strategy. In order to support custom serializers, you should use the `addSerializer` method explicitly.
