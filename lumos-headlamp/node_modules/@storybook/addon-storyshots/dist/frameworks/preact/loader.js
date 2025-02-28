"use strict";
/** @jsxRuntime classic */
/** @jsx h */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("@storybook/global");
const configure_1 = __importDefault(require("../configure"));
const hasDependency_1 = __importDefault(require("../hasDependency"));
function test(options) {
    return (options.framework === 'preact' || (!options.framework && (0, hasDependency_1.default)('@storybook/preact')));
}
function load(options) {
    global_1.global.STORYBOOK_ENV = 'preact';
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
    jest.mock('@storybook/preact', () => {
        const renderAPI = jest.requireActual('@storybook/preact');
        renderAPI.addDecorator = mockStartedAPI.clientApi.addDecorator;
        renderAPI.addParameters = mockStartedAPI.clientApi.addParameters;
        return renderAPI;
    });
    // eslint-disable-next-line global-require
    const storybook = require('@storybook/preact');
    (0, configure_1.default)({
        ...options,
        storybook,
    });
    return {
        framework: 'preact',
        renderTree: jest.requireActual('./renderTree').default,
        renderShallowTree: () => {
            throw new Error('Shallow renderer is not supported for preact');
        },
        storybook,
    };
}
const preactLoader = {
    load,
    test,
};
exports.default = preactLoader;
