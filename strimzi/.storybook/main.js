/**
 * Local Storybook config: extends headlamp-plugin config and adds webpack
 * resolve.fallback for 'tty' so the build succeeds (webpack 5 does not
 * polyfill Node core modules).
 */
const path = require('path');
const base = require('../node_modules/@kinvolk/headlamp-plugin/config/.storybook/main.js');

module.exports = {
  ...base,
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  // Don't serve mockServiceWorker.js – MSW is disabled; avoids SW intercepting fetches.
  staticDirs: [],
  webpackFinal: async (config) => {
    const c = await base.webpackFinal(config);
    c.resolve.fallback = {
      ...(c.resolve.fallback || {}),
      tty: require.resolve('tty-browserify'),
    };
    return c;
  },
};
