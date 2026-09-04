const path = require('path');
const base = require('../node_modules/@kinvolk/headlamp-plugin/config/.storybook/main.js');

module.exports = {
  ...base,
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  staticDirs: ['./public'],
  addons: [...(base.addons || []), 'msw-storybook-addon'],
  webpackFinal: async (config) => {
    const c = await base.webpackFinal(config);
    c.resolve.fallback = {
      ...(c.resolve.fallback || {}),
      tty: require.resolve('tty-browserify'),
    };
    return c;
  },
};
