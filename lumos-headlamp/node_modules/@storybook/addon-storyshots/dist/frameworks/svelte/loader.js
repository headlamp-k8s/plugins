"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("@storybook/global");
const hasDependency_1 = __importDefault(require("../hasDependency"));
const configure_1 = __importDefault(require("../configure"));
function test(options) {
    return (options.framework === 'svelte' || (!options.framework && (0, hasDependency_1.default)('@storybook/svelte')));
}
function load(options) {
    global_1.global.STORYBOOK_ENV = 'svelte';
    let mockStartedAPI;
    jest.mock('@storybook/preview-api', () => {
        const previewAPI = jest.requireActual('@storybook/preview-api');
        return {
            ...previewAPI,
            start: (...args) => {
                mockStartedAPI = previewAPI.start(...args);
                return mockStartedAPI;
            },
        };
    });
    jest.mock('@storybook/svelte', () => {
        const renderAPI = jest.requireActual('@storybook/svelte');
        renderAPI.addDecorator = mockStartedAPI.clientApi.addDecorator;
        renderAPI.addParameters = mockStartedAPI.clientApi.addParameters;
        return renderAPI;
    });
    // eslint-disable-next-line global-require
    const storybook = require('@storybook/svelte');
    (0, configure_1.default)({
        ...options,
        storybook,
    });
    return {
        framework: 'svelte',
        renderTree: jest.requireActual('./renderTree').default,
        renderShallowTree: () => {
            throw new Error('Shallow renderer is not supported for svelte');
        },
        storybook,
    };
}
const svelteLoader = {
    load,
    test,
};
exports.default = svelteLoader;
