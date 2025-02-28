const assert = require('assert');

const requireA = require.context('./a', false, /\.js$/);
assert.deepEqual(requireA.keys(), ['./a.js']);
assert.deepEqual(
  requireA.keys().map((key) => requireA(key)),
  ['a']
);
assert.equal(requireA.resolve('./a.js'), './a/a.js');

const requireAB = require.context('./a', true, /\.js$/);
assert.deepEqual(requireAB.keys(), ['./a.js', './b/b.js']);
assert.deepEqual(
  requireAB.keys().map((key) => requireAB(key)),
  ['a', 'b']
);
assert.equal(requireA.resolve('./a.js'), './a/a.js');
assert.equal(requireA.resolve('./b/b.js'), './a/b/b.js');

console.log('OK');
