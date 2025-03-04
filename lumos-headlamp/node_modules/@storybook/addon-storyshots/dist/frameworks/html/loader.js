"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("@storybook/global");
const configure_1 = __importDefault(require("../configure"));
function test(options) {
    return options.framework === 'html';
}
function load(options) {
    global_1.global.STORYBOOK_ENV = 'html';
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
    jest.mock('@storybook/html', () => {
        const renderAPI = jest.requireActual('@storybook/html');
        renderAPI.addDecorator = mockStartedAPI.clientApi.addDecorator;
        renderAPI.addParameters = mockStartedAPI.clientApi.addParameters;
        return renderAPI;
    });
    // eslint-disable-next-line global-require
    const storybook = require('@storybook/html');
    (0, configure_1.default)({
        ...options,
        storybook,
    });
    return {
        framework: 'html',
        renderTree: jest.requireActual('./renderTree').default,
        renderShallowTree: () => {
            throw new Error('Shallow renderer is not supported for HTML');
        },
        storybook,
    };
}
const htmLoader = {
    load,
    test,
};
exports.default = htmLoader;
