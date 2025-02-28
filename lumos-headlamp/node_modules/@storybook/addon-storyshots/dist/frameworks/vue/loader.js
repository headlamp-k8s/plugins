"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("@storybook/global");
const hasDependency_1 = __importDefault(require("../hasDependency"));
const configure_1 = __importDefault(require("../configure"));
function mockVueToIncludeCompiler() {
    jest.mock('vue', () => jest.requireActual('vue/dist/vue.common.js'));
}
function test(options) {
    return options.framework === 'vue' || (!options.framework && (0, hasDependency_1.default)('@storybook/vue'));
}
function load(options) {
    global_1.global.STORYBOOK_ENV = 'vue';
    mockVueToIncludeCompiler();
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
    jest.mock('@storybook/vue', () => {
        const renderAPI = jest.requireActual('@storybook/vue');
        renderAPI.addDecorator = mockStartedAPI.clientApi.addDecorator;
        renderAPI.addParameters = mockStartedAPI.clientApi.addParameters;
        return renderAPI;
    });
    // eslint-disable-next-line global-require
    const storybook = require('@storybook/vue');
    (0, configure_1.default)({
        ...options,
        storybook,
    });
    return {
        framework: 'vue',
        renderTree: jest.requireActual('./renderTree').default,
        renderShallowTree: () => {
            throw new Error('Shallow renderer is not supported for vue');
        },
        storybook,
    };
}
const vueLoader = {
    load,
    test,
};
exports.default = vueLoader;
