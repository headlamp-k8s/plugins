# MatcherCollection [![Build Status](https://travis-ci.org/stefanpenner/matcher-collection.svg?branch=master)](https://travis-ci.org/stefanpenner/matcher-collection) [![Build status](https://ci.appveyor.com/api/projects/status/v6hubn3kltp80ugm?svg=true)](https://ci.appveyor.com/project/embercli/matcher-collection)
Minimatch but for collections of minimatcher matchers.

## Install

```sh
yarn add matcher-collection
```

## Examples

```js
const MatcherCollection = require('matcher-collection')

const m = new MatcherCollection([
  'tests/',
  '**/*.js',
]);

m.match('tests/foo.js') // => true
m.match('foo.js')       // => false

m.mayContain('tests') // => true
m.mayContain('foo')   // => false
```
