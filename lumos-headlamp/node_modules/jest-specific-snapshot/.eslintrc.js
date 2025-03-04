const error = 2;
const warn = 1;
const ignore = 0;

module.exports = {
  root: true,
  extends: ['airbnb-base', 'prettier', "plugin:jest/recommended"],
  plugins: ['prettier', 'json', 'jest'],
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    "jest/globals": true
  },
  env: {
    es6: true,
    node: true,
    "jest/globals": true
  },
  rules: {
    'strict': [error, 'never'],
    'prettier/prettier': [
      warn,
      {
        printWidth: 100,
        tabWidth: 2,
        bracketSpacing: true,
        trailingComma: 'es5',
        singleQuote: true,
      },
    ],
    'quotes': [warn, 'single'],
    'class-methods-use-this': ignore,
    'arrow-parens': [warn, 'as-needed'],
    'space-before-function-paren': ignore,
    'import/no-unresolved': warn,
    'import/extensions': [
      warn,
      {
        js: 'never',
        json: 'always',
      },
    ],
    'import/prefer-default-export': ignore,
    'no-underscore-dangle': [error, { allow: ['_updateSnapshot'] }],
  },
};
