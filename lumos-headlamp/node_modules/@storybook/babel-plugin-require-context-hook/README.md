# babel-plugin-require-context-hook

> NOTE: This is a (hopefully temporary) fork of [babel-plugin-require-context-hook](https://github.com/smrq/babel-plugin-require-context-hook), which appears to be unmaintained.

## Usage

In your babelrc:

```
"plugins": [
	"@storybook/babel-plugin-require-context-hook"
]
```

Wherever you configure babel-register (your source file, a register script, etc):

```
require('@storybook/babel-plugin-require-context-hook/register')();
```

## How it works

The register script `@storybook/babel-plugin-require-context-hook/register` implements the function `require.context` with an extra parameter-- the directory in which the calling file resides-- and places that function on the global scope.

The Babel plugin `@storybook/babel-plugin-require-context-hook` rewrites all calls to `require.context` into calls to this global function, passing in `__dirname` as the extra parameter.
