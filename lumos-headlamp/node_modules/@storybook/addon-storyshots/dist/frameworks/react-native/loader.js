"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable global-require */
const path_1 = __importDefault(require("path"));
const hasDependency_1 = __importDefault(require("../hasDependency"));
function test(options) {
    return (options.framework === 'react-native' ||
        (!options.framework && (0, hasDependency_1.default)('@storybook/react-native')));
}
function configure(options, storybook) {
    const { configPath = 'storybook', config } = options;
    if (config && typeof config === 'function') {
        config(storybook);
        return;
    }
    const resolvedConfigPath = path_1.default.resolve(configPath);
    jest.requireActual(resolvedConfigPath);
}
function load(options) {
    const storybook = jest.requireActual('@storybook/react-native');
    configure(options, storybook);
    return {
        renderTree: require('../react/renderTree').default,
        renderShallowTree: require('../react/renderShallowTree').default,
        framework: 'react-native',
        storybook,
    };
}
const reactNativeLoader = {
    load,
    test,
};
exports.default = reactNativeLoader;
