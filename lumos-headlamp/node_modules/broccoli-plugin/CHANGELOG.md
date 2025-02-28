## v4.0.7 (2021-05-03)

#### :bug: Bug Fix
* Fix publishing issue with 4.0.6

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))



## v4.0.6 (2021-05-03)

#### :bug: Bug Fix
* [#62](https://github.com/broccolijs/broccoli-plugin/pull/62) Fix issues with `this.input` APIs (from fs-merger) ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v4.0.5 (2021-03-11)

#### :house: Internal
* [#61](https://github.com/broccolijs/broccoli-plugin/pull/61) Update devDependencies to latest ([@rwjblue](https://github.com/rwjblue))
* [#60](https://github.com/broccolijs/broccoli-plugin/pull/60) Update linting configuration and dependencies ([@rwjblue](https://github.com/rwjblue))
* [#59](https://github.com/broccolijs/broccoli-plugin/pull/59) Update dependencies to latest ([@rwjblue](https://github.com/rwjblue))
* [#58](https://github.com/broccolijs/broccoli-plugin/pull/58) Remove Travis CI and AppVeyor CI ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v4.0.4 (2021-03-11)

#### :bug: Bug Fix

- [#55](https://github.com/broccolijs/broccoli-plugin/pull/55) Avoid forcing eager calculation of error stacks ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal

- [#56](https://github.com/broccolijs/broccoli-plugin/pull/56) Add release automation setup ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1

- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

# Changelog

# 4.0.3

- Update to the latest fs-merger

# 4.0.2

- [Bugfix] Bump broccoli-output-wrapper to v3.2.Bump broccoli-output-wrapper to v3.2.11

# 4.0.1

- upgrade all dependencies

# 4.0.0

- [BREAKING] Drop Node 8 support
- [BREAKING] Upgrade broccoli-output-wrapper

# 3.1.0

- Add `this.input` and `this.ouput` to broccoli-plugin instances, this aims to replace nearly all usage of `this.inputPaths` and `this.outputPath`. See the `Readme` for further details

# 3.0.0

- Add `pluginInterface.trackInputChanges` and expose as `options.trackInputChanges`. This adds a change object
  that will be passed to the build method which contains information about which input has changed since the
  last build.

- Convert to typescript

- Drop node 6 support

# 2.1.0

- Add `pluginInterface.volatile` and expose as `options.volatile`. This tells broccoli to opt out of memoization and
  the build method will always be called regardless if the inputNodes have changed.

# 2.0.0

- [BREAKING] modernize code-base, use ES classes
- [BREAKING] set a new node engine version support "node": "6._ || 8._ || >= 10.\*"

# 1.3.1

- Update the validation for input nodes. Previously passing `[]` as an input
  node wasn't caught by the validation but caused an error later during
  `.build` method invocation.

# 1.3.0

- Add `pluginInterface.needsCache` and expose as `options.needsCache`. This adds the ability
  to opt-out of cache directory creation.

# 1.2.3

- Avoid extra work in `.read`-compatibility mode when input nodes have stable output paths

# 1.2.2

- Whitelist JS files in package.json
- re-release without tmp/

# 1.2.1

- Throw error immediately when inputNodes contains something other than input nodes

# 1.2.0

- Add `sourceDirectories` feature flag, which introduces `pluginInterface.nodeType`
- Allow for calling `__broccoliGetInfo__()` without argument

# 1.1.0

- Add `persistentOutput` flag

# 1.0.0

- Initial release
